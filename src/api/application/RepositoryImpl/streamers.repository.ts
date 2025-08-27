//import "reflect-metadata"
import { injectable } from "tsyringe"
import { Equal, In, IsNull, LessThan, Like, MoreThan, Not, UpdateResult } from "typeorm"
import { validate as isUuid } from 'uuid';
import { Streamers } from "../../domain/entities/streamers.entity.js"
import { IStreamersRepository } from "../../domain/repository/IStreamersRepository.js"
import { dataSource } from "../config/datasource.js"
import { CrudRepository } from "./crud.repository.js"
import { platform } from "node:os"
import { Process } from "../../infrastructure/processManager/interfaces.js"

interface UserRegister {
  name: string;
  email: string;
  password: string;
}


@injectable()
export class StreamersRepository
  extends CrudRepository<Streamers | any>
  implements IStreamersRepository {

  async isStreamerExist(name: string): Promise<boolean> {
    const existingUser = await dataSource.manager.findOne<any>(Streamers, { where: { name } })
    return !!existingUser;
  }

  async isStreamerExist_for_update(name: string, platform: string): Promise<boolean> {
    const existingUser = await dataSource.manager.findOne<any>(Streamers, { where: { name, platform } })
    return !!existingUser;
  }

  async getAllStreamersNameEAvatar(): Promise<Streamers[] | any> {
    const streamers = await dataSource.manager.find<Streamers>(Streamers, {
      where: {
        avatar: Not(Like('https://i.ibb.co%')) // Filtra os streamers cujo avatar_url não começa com 'https://i.ibb.co'
      },
      select: ['name', 'avatar'], // Seleciona apenas os campos 'name' e 'avatar_url'
    });

    return streamers.length > 0 ? streamers : null;
  }

  async getAllStreamers(): Promise<Streamers[] | null> {
    const streamers = await dataSource.manager.find<Streamers>(Streamers, {
      select: ['name', 'platform'], // Seleciona apenas os campos 'name' e 'platform'
    });

    return streamers.length > 0 ? streamers : null;
  }

  async getStreamersWithoutSpecificCountries(): Promise<Streamers[] | null> {
    const streamers = await dataSource.manager.find<Streamers>(Streamers, {
      select: ["name", "platform"],
      where: [
        { country: Not(In(["br", "co"])) }, // Diferente de "br" e "co"
        { country: IsNull() } // Ou onde country seja NULL
      ]
    });

    return streamers.length > 0 ? streamers : null;
  }

  async getStreamersForSavingBuilder(): Promise<Streamers[] | null> {
    try {
      // Ensure DataSource is initialized

      // Step 1: Find streamers using createQueryBuilder
      const streamers = await dataSource.manager
        .createQueryBuilder(Streamers, "streamer")
        .where("streamer.is_saving = :isSaving", { isSaving: false })
        .andWhere("streamer.baned = :baned", { baned: false })
        .orderBy("streamer.number_followers", "DESC")
        .take(5)
        .select([
          "streamer.id",
          "streamer.name",
          "streamer.platform",
          "streamer.country",
        ])
        .getMany();

      if (streamers.length === 0) {
        console.log("No streamers found");
        return null;
      }

      // Step 2: Update the found streamers
      const streamerIds = streamers.map((streamer) => streamer.id);
      await dataSource.manager
        .createQueryBuilder()
        .update(Streamers)
        .set({ is_saving: true })
        .where("id IN (:...ids)", { ids: streamerIds })
        .execute();

      return streamers;
    } catch (error) {
      console.error("Error in getStreamersForSaving:", error);
      throw new Error("Unable to update streamers.");
    }
  }

  async getStreamers(): Promise<Streamers[] | null> {
    try {
      // Iniciar uma transação com bloqueio
      return await dataSource.manager.transaction(async (transactionalEntityManager) => {
        // Passo 1: Buscar streamers com bloqueio exclusivo
        const streamers = await transactionalEntityManager.find(Streamers, {
          where: { /*is_saving: false,*/ baned: false },
          order: { created_at: "ASC", },
          //take: 5,
          select: ['id', 'name', 'platform', 'country'],
          lock: { mode: 'pessimistic_write' }, // Bloqueio exclusivo (FOR UPDATE)
        });

        if (streamers.length === 0) {
          return null; // Retorna null se não houver streamers disponíveis
        }

        // Passo 2: Atualizar os registros encontrados dentro da transação
        /*const streamerIds = streamers.map((streamer) => streamer.id);
        await transactionalEntityManager.update(
          Streamers,
          { id: In(streamerIds) },
          { is_saving: true }
        );*/

        return streamers;
      });
    } catch (error) {
      console.error('Error getting streamers for LiveSaver:', error);
      throw new Error('Unable to update streamers.');
    }
  }

  async getMoreStreamers(last_streamer_id: string): Promise<Streamers[] | null> {
    try {
      return await dataSource.manager.transaction(async (transactionalEntityManager) => {

        let lastStreamerCreatedAt: Date | null = null;
        if (last_streamer_id) {
          const lastStreamer = await transactionalEntityManager.findOne(Streamers, {
            where: { id: Equal(last_streamer_id) },
            select: ['created_at'],
          });
          if (!lastStreamer) {
            throw new Error(`Last streamer with ID ${last_streamer_id} not found.`);
          }
          lastStreamerCreatedAt = lastStreamer.created_at;
        }

        // Construir condições de filtro
        const whereClause = {
          baned: false,
          //platform: Equal(platform),
        };

        // Filtrar streamers com created_at maior que o do last_streamer
        if (lastStreamerCreatedAt) {
          whereClause['created_at'] = MoreThan(new Date(lastStreamerCreatedAt));
        }

        if (last_streamer_id) {
          whereClause['id'] = Not(Equal(last_streamer_id));
        }

        // Buscar streamers com bloqueio exclusivo
        const streamers = await transactionalEntityManager.find(Streamers, {
          where: whereClause,
          order: { created_at: "ASC", },
          select: ['id', 'name', 'platform', 'country'],
          lock: { mode: 'pessimistic_write' }, // Bloqueio exclusivo (FOR UPDATE)
        });

        if (streamers.length === 0) {
          return null; // Retorna null se não houver streamers disponíveis
        }

        return streamers;
      });
    } catch (error) {
      console.error('Error getting streamers for LiveSaver:', { error, last_streamer_id, platform });
      throw new Error('Unable to update streamers.');
    }
  }

  async completeInsufficientStreamersForSaving2(last_streamer: { streamer: string, platform: string }): Promise<Streamers[] | null> {
    try {
      // Iniciar uma transação com bloqueio
      return await dataSource.manager.transaction(async (transactionalEntityManager) => {
        // Passo 1: Buscar streamers com bloqueio exclusivo
        const streamers = await transactionalEntityManager.find(Streamers, {
          where: { /*is_saving: false,*/ baned: false },
          order: { number_followers: 'DESC' },
          select: ['id', 'name', 'platform', 'country'],
          lock: { mode: 'pessimistic_write' }, // Bloqueio exclusivo (FOR UPDATE)
        });

        if (streamers.length === 0) {
          return null; // Retorna null se não houver streamers disponíveis
        }

        return streamers;
      });
    } catch (error) {
      console.error('Error getting streamers for LiveSaver:', error);
      throw new Error('Unable to update streamers.');
    }
  }

  async getStreamersForBan(): Promise<Streamers[] | null> {
    try {
      // Adiciona um atraso de 10 segundos
      //await new Promise((resolve) => setTimeout(resolve, 10000));

      // Passo 1: Buscar os streamers que podem ser salvos
      const streamers = await dataSource.manager.find(Streamers, {
        where: { baned: false },
        order: { number_followers: "DESC" },
        take: 5, // Limita a 5 streamers
        select: ["id", "name", "platform"], // Retorna apenas os campos desejados
      });

      if (streamers.length === 0) {
        return null; // Retorna null se não houver streamers disponíveis
      }

      // Passo 2: Atualizar os registros encontrados
      const streamerIds = streamers.map((streamer) => streamer.id);

      await dataSource.manager.update(
        Streamers,
        { id: In(streamerIds) }, // Atualiza apenas os IDs encontrados
        { is_saving: true } // Marca como "sendo salvos"
      );

      return streamers;
    } catch (error) {
      console.error("Error get streamers for LiveSaver:", error);
      throw new Error("Unable to update streamers.");
    }
  }

  async updateOffline(offs: Process[]): Promise<UpdateResult[]> {
    try {

      const ids = offs.map((str) => {
        return str.streamer_id;
      })
      // Adiciona um atraso de 10 segundos
      //await new Promise((resolve) => setTimeout(resolve, 10000));

      // Passo 1: Buscar os streamers que podem ser salvos
      return await dataSource.manager.update(
        Streamers,
        { id: In(ids) }, // Atualiza apenas os IDs encontrados
        {
          online: false,
          mainurlm3u8: ''
        } // Marca como "sendo salvos"
      );

    } catch (error) {
      console.error("Error get streamers for LiveSaver:", error);
      throw new Error("Unable to update streamers.");
    }
  }

  async updateOnline(online: Process[]): Promise<UpdateResult> {
    try {
        if (!Array.isArray(online) || online.length === 0) {
            return { affected: 0, raw: [], generatedMaps: [] };
        }

        // Validação
        const invalid: Array<{ index: number; reasons: string[]; item: any }> = [];
        const normalized = online.map((item, index) => {
            const id = item?.streamer_id?.toString().trim();
            const rawUrl = (item?.urlM3U8 ?? item?.urlM3U8 ?? '') as string;
            const url = rawUrl.trim();
            const title = (item?.tittle ?? '') as string; // Captura o title

            const reasons: string[] = [];
            if (!id || !isUuid(id)) reasons.push('streamer_id inválido (não é UUID)');
            if (!url) reasons.push('urlM3U8 vazia/ausente');
            // Opcional: Adicionar validação para title, se necessário
            if (!title) reasons.push('title vazio/ausente');

            if (reasons.length) invalid.push({ index, reasons, item });

            return { streamer_id: id, urlM3U8: url, curr_title: title }; // Inclui curr_title
        });

        if (invalid.length) {
            console.warn('[updateOnline] Itens inválidos ignorados:', invalid);
        }

        const valid = normalized.filter((_, i) => !invalid.some(v => v.index === i));
        if (valid.length === 0) {
            return { affected: 0, raw: [], generatedMaps: [] };
        }

        // Dedup por UUID
        const byId = new Map<string, { urlM3U8: string; curr_title: string }>();
        for (const { streamer_id, urlM3U8, curr_title } of valid) {
            if (!byId.has(streamer_id)) byId.set(streamer_id, { urlM3U8, curr_title });
        }

        const ids = Array.from(byId.keys());
        const urlCaseExpr =
            'CASE ' +
            ids.map((_, i) => `WHEN id = :id${i} THEN :url${i}`).join(' ') +
            ' ELSE mainurlm3u8 END';
        const titleCaseExpr =
            'CASE ' +
            ids.map((_, i) => `WHEN id = :id${i} THEN :title${i}`).join(' ') +
            ' ELSE curr_title END';

        // Monta parâmetros
        const params: Record<string, any> = {};
        ids.forEach((id, i) => {
            params[`id${i}`] = id;
            params[`url${i}`] = byId.get(id)!.urlM3U8;
            params[`title${i}`] = byId.get(id)!.curr_title;
        });

        const qb = dataSource.manager
            .createQueryBuilder()
            .update('streamers')
            .set({
                online: true,
                mainurlm3u8: () => urlCaseExpr,
                curr_title: () => titleCaseExpr, // Atualiza a coluna curr_title
            })
            .where('id IN (:...ids)', { ids })
            .setParameters(params);

        const result = await qb.execute();

        return {
            affected: result.affected ?? 0,
            raw: result.raw ?? [],
            generatedMaps: result.generatedMaps ?? [],
        };
    } catch (error: any) {
        console.error('Error updating streamers online status:', {
            error: error?.message,
            stack: error?.stack,
            inputCount: online?.length || 0,
        });
        throw new Error(`Failed to update streamers online status: ${error?.message}`);
    }
}

  async updateOnline3(online: Process[]): Promise<UpdateResult> {
    try {
      online[0].tittle
      if (!Array.isArray(online) || online.length === 0) {
        return { affected: 0, raw: [], generatedMaps: [] };
      }

      // Validação
      const invalid: Array<{ index: number; reasons: string[]; item: any }> = [];
      const normalized = online.map((item, index) => {
        const id = item?.streamer_id?.toString().trim();
        const rawUrl = (item?.urlM3U8 ?? item?.urlM3U8 ?? '') as string;
        const url = rawUrl.trim();

        const reasons: string[] = [];
        if (!id || !isUuid(id)) reasons.push('streamer_id inválido (não é UUID)');
        if (!url) reasons.push('urlM3U8 vazia/ausente');

        if (reasons.length) invalid.push({ index, reasons, item });

        return { streamer_id: id, urlM3U8: url };
      });

      if (invalid.length) {
        console.warn('[updateOnline] Itens inválidos ignorados:', invalid);
      }

      const valid = normalized.filter((_, i) => !invalid.some(v => v.index === i));
      if (valid.length === 0) {
        return { affected: 0, raw: [], generatedMaps: [] };
      }

      // Dedup por UUID
      const byId = new Map<string, string>();
      for (const { streamer_id, urlM3U8 } of valid) {
        if (!byId.has(streamer_id)) byId.set(streamer_id, urlM3U8);
      }

      const ids = Array.from(byId.keys());
      const caseExpr =
        'CASE ' +
        ids.map((_, i) => `WHEN id = :id${i} THEN :url${i}`).join(' ') +
        ' ELSE mainurlm3u8 END';

      // Monta parâmetros
      const params: Record<string, any> = {};
      ids.forEach((id, i) => {
        params[`id${i}`] = id;
        params[`url${i}`] = byId.get(id)!;
      });

      const qb = dataSource.manager
        .createQueryBuilder()
        .update('streamers')
        .set({
          online: true,
          mainurlm3u8: () => caseExpr,
        })
        .where('id IN (:...ids)', { ids })
        .setParameters(params);

      const result = await qb.execute();

      return {
        affected: result.affected ?? 0,
        raw: result.raw ?? [],
        generatedMaps: result.generatedMaps ?? [],
      };
    } catch (error: any) {
      console.error('Error updating streamers online status:', {
        error: error?.message,
        stack: error?.stack,
        inputCount: online?.length || 0,
      });
      throw new Error(`Failed to update streamers online status: ${error?.message}`);
    }
  }

  async updateOnline2(online: Process[]): Promise<UpdateResult[]> {
    try {

      const ids = online.map((str) => {
        return str.streamer_id;
      })
      const urls = online.map((str) => {
        return str.urlM3U8;
      })

      return await dataSource.manager.update(
        Streamers,
        { id: In(ids) }, // Atualiza apenas os IDs encontrados
        {
          online: true,
          mainurlm3u8: ''
        },
      );

    } catch (error) {
      console.error("Error get streamers for LiveSaver:", error);
      throw new Error("Unable to update streamers.");
    }
  }

  async addBan(streamer: string, platform: string): Promise<any> {
    try {
      return await dataSource.manager.update(
        Streamers,           // entidade
        {                    // condições do where
          name: streamer,
          platform: platform
        },
        {                    // dados para atualizar
          baned: true
        }
      );
    } catch (error) {
      console.error("Error banning streamer:", error);
      throw new Error("Unable to update streamer.");
    }
  }

  async returnStreamersToDatabase(streamers: { streamer: string; platform: string }[]): Promise<UpdateResult | null> {
    if (streamers.length === 0) {
      return null; // Retorna null caso o array esteja vazio
    }
  
    try {
      // Extrai os nomes e plataformas do array de streamers
      const names = streamers.map((s) => s.streamer);
      const platforms = streamers.map((s) => s.platform);
  
      const update = await dataSource.manager
        .createQueryBuilder()
        .update(Streamers)
        .set({ online: false, mainurlm3u8: '',curr_title:'' })
        .where("name IN (:...names) AND platform IN (:...platforms)", { names, platforms }) // Filtra por nome e plataforma
        //.returning(["name", "platform"]) // Retorna os campos desejados, se necessário
        .execute();
  
      return update.raw.length > 0 ? update : null; // Retorna o resultado da query ou null
    } catch (error) {
      console.error("Error updating streamers:", error);
      throw new Error("Unable to update streamers.");
    }
  }

  async returnStreamersToDatabase2(streamers: string[]): Promise<UpdateResult | null> {
    if (streamers.length === 0) {
      return null; // Retorna null caso o array esteja vazio
    }
    try {
      const update = await dataSource.manager
        .createQueryBuilder()
        .update(Streamers)
        .set({ online: false,mainurlm3u8:'' })
        .where("name IN (:...names)", { names: streamers }) // Filtra pelos nomes fornecidos no array
        //.returning(["name", "platform"]) // Retorna os campos desejados
        .execute();

      return update.raw.length > 0 ? update.raw : null;
    } catch (error) {
      console.error("Error updating streamers:", error);
      throw new Error("Unable to update streamers.");
    }
  }

  async updateStopSaving(name: string, platform = 'tikitok'): Promise<Streamers[] | any> {

    return await dataSource.manager.update(Streamers, { name, platform }, { is_saving: false });
  }

  async isStreamerExist_for_Update(name: string, platform: string): Promise<boolean> {
    const existingUser = await dataSource.manager.findOne<any>(Streamers, { where: { name, platform } })
    return !!existingUser;
  }


  async updateMainUrl(name: string, main_url: string, platform: string): Promise<any> {
    try {
      /*return await dataSource.manager.update<any>('mainurlm3u8',Streamers,
        {
          update: { mainurlm3u8: main_url },
          where: { name: Equal(streamer),platform:Equal(platform) }
        }
      )*/
      return await dataSource.manager.update(Streamers, { name, platform }, { mainurlm3u8: main_url });

      //return await dataSource.manager.save<any>(Streamers)
    } catch (error) {
      throw new Error((error as Error).message)
    }
  }

  async updateAvatarUrl(name: string, platform: string, avatar: string): Promise<any> {
    try {
      /*return await dataSource.manager.update<any>('mainurlm3u8',Streamers,
        {
          update: { mainurlm3u8: main_url },
          where: { name: Equal(streamer),platform:Equal(platform) }
        }
      )*/
      return await dataSource.manager.update(Streamers, { name, platform }, { avatar: avatar });

      //return await dataSource.manager.save<any>(Streamers)
    } catch (error) {
      throw new Error((error as Error).message)
    }
  }

  async updateCountry(name: string, platform: string, country: string): Promise<UpdateResult[]> {
    try {
      /*return await dataSource.manager.update<any>('mainurlm3u8',Streamers,
        {
          update: { mainurlm3u8: main_url },
          where: { name: Equal(streamer),platform:Equal(platform) }
        }
      )*/
      return await dataSource.manager.update(Streamers, { name, platform }, { country: country });

      //return await dataSource.manager.save<any>(Streamers)
    } catch (error) {
      throw new Error((error as Error).message)
    }
  }

  async addStreamer(name: string, platform: string, avatar: string, country: string): Promise<any> {
    if (!avatar?.length) {
      //avatar = "https://i-kebab.bunkr.ru/user_image-VedoGHuK.jpg";
    }
    try {

      const streamer: Streamers = new Streamers(name, platform, avatar, country)

      if (streamer) {
        return await dataSource.manager.save<Streamers>(Streamers, streamer)
      } else {
        return await false
      }

    } catch (error) {
      throw new Error((error as Error).message)
    }
  }

  async getCountry(name: string, platform: string): Promise<any> {
    try {
      const streamer = await dataSource.manager.find<Streamers>(Streamers, {
        select: ["country"],
        where: {
          name, platform
        }
      })

      return streamer[0].country;

    } catch (error) {
      throw new Error((error as Error).message)
    }
  }

  async getStreamerId(name: string, platform: string): Promise<string> {
    try {
      const streamer = await dataSource.manager.find<Streamers>(Streamers, {
        where: {
          name,
          platform
        },
        select: ["id"]
      });

      if (streamer.length > 0) {
        return streamer[0].id;
      } else {
        return '';  // Ou outra forma de tratar a ausência do streamer
      }
    } catch (error) {
      console.error('Error in search streamer:', error);
      return '';  // Retornar valor de fallback em caso de erro
    }
  }

  async getUrl(name: string, plataform: string): Promise<any> {

    try {
      const sql = `
        SELECT mainurlm3u8
        FROM streamers
        WHERE name = $1 AND platform = $2
      `;
      const streamer: Streamers = new Streamers(name, plataform)
      let streamerExist = await this.isStreamerExist(name)

      if (!streamerExist) {
        return await dataSource.manager.query(sql, [name, plataform])
      } else {
        return await false
      }

    } catch (error) {
      throw new Error((error as Error).message)
    }
  }

  async addAlbumID(name: string, _album_id: string, platform: string): Promise<UpdateResult[]> {
    try {
      /*return await dataSource.manager.update<any>('mainurlm3u8',Streamers,
        {
          update: { mainurlm3u8: main_url },
          where: { name: Equal(streamer),platform:Equal(platform) }
        }
      )*/
      return await dataSource.manager.update(Streamers, { name, platform }, { album_id: _album_id });

      //return await dataSource.manager.save<any>(Streamers)
    } catch (error) {
      throw new Error((error as Error).message)
    }
  }

  async getAlbumStreamer(name: string, platform: string): Promise<string> {
    const streamer = await dataSource.manager.find<Streamers>(Streamers, {
      where: {
        name, platform
      },
      select: ["album_id"]
    });

    const id = streamer[0]?.album_id;

    if (id) {
      return id;
    }
    else {
      return ''
    }

    /* if (!streamer[0].album_id) {
       return ''
     }
   
     return streamer[0].album_id*/

  }


  /*async userExist(email: string): Promise<Boolean> {
    try {
      return await dataSource.manager.exists<any>(Users, {
        email: Equal(email)
      })
    } catch (error) {
      throw new Error((error as Error).message)
    }
  }*/
}

function LIKE(arg0: string): any {
  throw new Error("Function not implemented.")
}
