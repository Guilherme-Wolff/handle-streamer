import { DataSource, DataSourceOptions, DeepPartial, DeleteResult, EntityManager, EntitySchema, EntityTarget, FindManyOptions, FindOneOptions, FindOptionsWhere, MixedList, ObjectId, ObjectLiteral, QueryRunner, Repository, SaveOptions, SelectQueryBuilder, UpdateResult } from "typeorm"
import { dataSource1, dataSource2 } from "./datasource.js"
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity.js";
import { IsolationLevel } from "typeorm/driver/types/IsolationLevel.js";

type SelectorStrategy = 'round-robin' | 'random' | 'least-connections';

type TransactionCallback<T> = (transactionalEntityManager: EntityManager) => Promise<T>;

// Interface para opções da transação
interface TransactionOptions {
  isolationLevel?: IsolationLevel;
  timeout?: number;
}

export class MultiBb {

  constructor() {
  }

  public manager = new MultiDbFunctions([/*dataSource1,*/ dataSource2])

  public async initialize() {
    try {
      // Usar Promise.all para esperar a inicialização de todos os DataSources
      await Promise.all(
        this.manager.dataSources.map(async (db: DataSource, index: number) => {
          if (!db.isInitialized) {
            await db.initialize();
            console.log(`Conexão inicializada com o banco de dados ${index}`);
            // Opcional: Configurar encoding, se necessário
            // await db.query("SET client_encoding = 'UTF8'");
          } else {
            console.log(`Banco de dados ${index} já está inicializado`);
          }
        })
      );
    } catch (error) {
      console.error("Erro ao inicializar DataSources:", error);
      throw new Error("Falha ao inicializar conexões com o banco de dados");
    }
  }

  public async initialize2() {
    this.manager.dataSources.map(async (db: DataSource, index: number) => {
      await db.initialize().then(async () => {
        //await dataSource2.query("SET client_encoding = 'UTF8'");
        console.log("Connection initialized with database :", index);
      })
        .catch((error) => console.log(error));
    })
  }



  public async synchronize(options?: { force?: boolean, transaction?: boolean }): Promise<void> {
    try {
      await Promise.all(
        this.manager.dataSources.map(async (db: DataSource, index: number) => {
          try {
            await db.synchronize(options as any);
            console.log(`Schema synchronized with database: ${index}`);
            return true;
          } catch (error) {
            console.error(`Failed to synchronize database ${index}:`, error);
            throw error;
          }
        })
      );
      console.log("All database schemas synchronized successfully");
    } catch (error) {
      console.error("Database synchronization failed:", error);
      throw new Error("Failed to synchronize one or more database schemas");
    }
  }

  /**
   * Fecha todas as conexões de banco de dados
   * @returns Promise que resolve quando todas as conexões são fechadas
   */
  public async close(): Promise<void> {
    try {
      await Promise.all(
        this.manager.dataSources.map(async (db: DataSource, index: number) => {
          try {
            await db.destroy();
            console.log(`Connection closed with database: ${index}`);
            return true;
          } catch (error) {
            console.error(`Failed to close database ${index}:`, error);
            throw error;
          }
        })
      );
      console.log("All database connections closed successfully");
    } catch (error) {
      console.error("Database closing failed:", error);
      throw new Error("Failed to close one or more database connections");
    }
  }

  /**
   * Executa uma consulta SQL personalizada em todos os bancos de dados
   * @param query String da consulta SQL a ser executada
   * @returns Promise que resolve para um array com os resultados de cada banco de dados
   */
  public async executeQuery(query: string): Promise<any[]> {
    try {
      const results = await Promise.all(
        this.manager.dataSources.map(async (db: DataSource, index: number) => {
          try {
            const result = await db.query(query);
            console.log(`Query executed on database ${index}`);
            return { index, result };
          } catch (error) {
            console.error(`Query failed on database ${index}:`, error);
            throw error;
          }
        })
      );
      return results;
    } catch (error) {
      console.error("Query execution failed:", error);
      throw new Error("Failed to execute query on one or more databases");
    }


  }



  /*public createQueryBuilder<Entity extends ObjectLiteral>(entityClass: EntityTarget<Entity>, alias: string, queryRunner?: QueryRunner): any{
    console.log("entityClass :", entityClass)
    console.log("alias :", alias)
    console.log("queryRunner :", queryRunner)
    

    const dataSource = this.manager.getDataSourceForEntity(entityClass); // Supondo que você tenha um método para isso.
    return dataSource.createQueryBuilder(entityClass, alias, queryRunner);
  }*/
}

export class MultiDbFunctions {
  public dataSources: DataSource[];

  public currentIndex: number = 0;
  public connectionCounts: number[];
  public strategy: SelectorStrategy;

  constructor(dataSources: DataSource[], strategy: SelectorStrategy = 'round-robin') {
    this.dataSources = dataSources;
    this.strategy = strategy;
    this.connectionCounts = new Array(dataSources.length).fill(0);
  }

  /**
   * Seleciona automaticamente o índice do banco de dados baseado na estratégia escolhida
   */

  public getDB(): DataSource {
    const db = this.dataSources[this.currentIndex];

    // Atualiza o índice para o próximo banco, voltando ao início quando necessário
    this.currentIndex = (this.currentIndex + 1) % this.dataSources.length;

    return db;
  }

  /*private selectDb(): number {
    switch (this.strategy) {
      case 'round-robin':
        this.currentIndex = (this.currentIndex + 1) % this.dataSources.length;
        return this.currentIndex;

      case 'random':
        return Math.floor(Math.random() * this.dataSources.length);

      case 'least-connections':
        const minConnections = Math.min(...this.connectionCounts);
        return this.connectionCounts.indexOf(minConnections);

      default:
        return 0;
    }
  }*/

  /**
   * Gerencia o contador de conexões para um determinado banco
   */
  private async withConnectionTracking<T>(dbIndex: number, operation: () => Promise<T>): Promise<T> {
    this.connectionCounts[dbIndex]++;
    try {
      const result = await operation();
      return result;
    } finally {
      this.connectionCounts[dbIndex]--;
    }
  }

  /**
   * Valida o índice do banco de dados
   */
  private validateDbIndex(dbIndex: number): void {
    if (dbIndex < 0 || dbIndex >= this.dataSources.length) {
      throw new Error('Índice do banco de dados inválido');
    }
  }

  async query<T = any>(query: string, parameters?: any[]): Promise<T> {

    const repository = this.getDB().manager;

    return await repository.query(query, parameters ? parameters : []);
  }

  /**
   * Salva os dados em todas as conexões de banco de dados.
   * @param entity - A entidade que será salva.
   * @param data - Os dados a serem salvos.
   */
  async save<T extends object>(entityClass: EntityTarget<any>, data: T): Promise<any> {
    try {
      // Salva primeiro no DB principal
      const primaryResult = await this.dataSources[0].manager.save(entityClass, data);
      console.log("SAVE : ", primaryResult)

      // Garante que vamos usar exatamente o mesmo objeto com os mesmos timestamps
      const exactCopy = this.dataSources[0].manager.create(
        primaryResult.constructor as any,
        { ...primaryResult } // Faz uma cópia exata do objeto, incluindo timestamps
      );

      // Copia para os outros DBs usando o objeto exato
      const secondaryResults = await Promise.all(
        this.dataSources.slice(1).map(async (db) => {
          try {
            // Desabilita a atualização automática de timestamps no DB secundário
            const result = await db.manager
              .createQueryBuilder()
              .insert()
              .into(primaryResult.constructor as any)
              .values(exactCopy as any) // Usamos a cópia exata com os mesmos dados
              .execute();

            return result;
          } catch (error) {
            console.error(`Erro ao salvar no DB secundário: ${(error as Error).message}`);
            throw error;
          }
        })
      );

      return [primaryResult, ...secondaryResults];
    } catch (error) {
      console.error(`Erro ao salvar: ${(error as Error).message}`);
      throw new Error(`Falha ao salvar nos bancos de dados: ${(error as Error).message}`);
    }
  }

  public createQueryBuilder<Entity extends ObjectLiteral>(
    entityClass?: EntityTarget<Entity>,
    alias?: string,
    queryRunner?: QueryRunner,
  ): SelectQueryBuilder<Entity> {
    console.log("entityClass :", entityClass)
    console.log("alias :", alias)
    console.log("queryRunner :", queryRunner)
    const dataSource = this.getDB()

    if (!dataSource) {
      throw new Error(`Nenhum DataSource encontrado para a entidade: ${entityClass}`);
    }

    return dataSource.createQueryBuilder(entityClass ? entityClass : '', alias ? alias : '', queryRunner);
  }




  /**
    * Executa uma busca em um banco de dados automaticamente selecionado ou específico.
    */
  find<Entity extends ObjectLiteral>(entityClass: EntityTarget<Entity>, options?: FindManyOptions<Entity>): Promise<Entity[]> {
    //const repository = this.getDB().manager;
    const repository = this.getDB().getRepository(entityClass).manager
    return repository.find(entityClass, options);
  }
  

  /**
   * Busca um único registro em um banco de dados automaticamente selecionado ou específico.
   */
  findOne<Entity extends ObjectLiteral>(entityClass: EntityTarget<Entity>, options: FindOneOptions<Entity>): Promise<Entity | null> {
    const repository = this.getDB().manager
    return repository.findOne(entityClass, options);
    //return repository.findOne({ where: data });
  }

  findOneBy<Entity extends ObjectLiteral>(
    entityClass: EntityTarget<Entity>,
    where: FindOptionsWhere<Entity> | FindOptionsWhere<Entity>[]
  ): Promise<Entity | null> {
    const repository = this.getDB().getRepository(entityClass);
    return repository.findOneBy(where);
  }

  /*delete<Entity extends ObjectLiteral>(targetOrEntity: EntityTarget<Entity>, criteria: string | string[] | number | number[] | Date | Date[] | ObjectId | ObjectId[] | any): Promise<DeleteResult> {
    
  }*/

  /*update<Entity extends ObjectLiteral>(target: EntityTarget<Entity>, criteria: string | string[] | number | number[] | Date | Date[] | ObjectId | ObjectId[] | any, partialEntity: QueryDeepPartialEntity<Entity>): Promise<UpdateResult> {
    
  }*/

  async update<Entity extends ObjectLiteral>(
    targetOrEntity: EntityTarget<Entity>,
    criteria: string | string[] | number | number[] | Date | Date[] | ObjectId | ObjectId[] | any,
    partialEntity: QueryDeepPartialEntity<Entity>
  ): Promise<UpdateResult[]> {
    try {
      // Atualiza primeiro no DB principal
      const primaryResult = await this.dataSources[0].manager.update(
        targetOrEntity,
        criteria,
        partialEntity
      );

      // Replica a mesma atualização nos outros DBs
      const secondaryResults = await Promise.all(
        this.dataSources.slice(1).map(async (db) => {
          try {
            return await db.manager.update(
              targetOrEntity,
              criteria,
              partialEntity
            );
          } catch (error) {
            console.error(`Erro ao atualizar no DB secundário: ${(error as Error).message}`);
            throw error;
          }
        })
      );

      return [primaryResult, ...secondaryResults];
    } catch (error) {
      console.error(`Erro ao atualizar: ${(error as Error).message}`);
      throw new Error(`Falha ao atualizar nos bancos de dados: ${(error as Error).message}`);
    }
  }

  /**
   * Insere um novo registro em um banco de dados automaticamente selecionado ou específico.
   */


  async remove<T extends object>(
    entityClass: EntityTarget<T>,
    where: FindOptionsWhere<T>
  ): Promise<any[]> {
    try {

      const secondaryResults = await Promise.all(
        this.dataSources.map(async (db, index) => {
          try {
            const result = await db.manager.delete(entityClass, where);
            console.log(`REMOVE (secundário ${index}):`, result);
            return result;
          } catch (error) {
            console.error(`Erro ao remover no DB secundário ${index}: ${(error as Error).message}`);
            throw error;
          }
        })
      );
  
      return [...secondaryResults];
    } catch (error) {
      console.error(`Erro ao remover: ${(error as Error).message}`);
      throw new Error(`Falha ao remover nos bancos de dados: ${(error as Error).message}`);
    }
  }

  async delete<T extends object>(
    entityClass: EntityTarget<T>,
    where: FindOptionsWhere<T>
  ): Promise<any[]> {
    try {
      // 2. Tenta remover dos DBs secundários
      const secondaryResults = await Promise.all(
        this.dataSources.map(async (db, index) => {
          try {
            const result = await db.manager.delete(entityClass, where);
            console.log(`REMOVE (secundário ${index}):`, result);
            return result;
          } catch (error) {
            console.error(`Erro ao remover no DB secundário ${index}: ${(error as Error).message}`);
            throw error;
          }
        })
      );
  
      return [...secondaryResults];
    } catch (error) {
      console.error(`Erro ao remover: ${(error as Error).message}`);
      throw new Error(`Falha ao remover nos bancos de dados: ${(error as Error).message}`);
    }
  }

  async saveWithTransaction<Entity extends ObjectLiteral>(entityClass: EntityTarget<Entity>, data: Entity): Promise<Entity[]> {
    try {
      // Passo 1: Salva no banco primário com transação
      const repository = this.dataSources[0].getRepository(entityClass).manager;
      const primaryResult = await repository.transaction(async (transactionalEntityManager) => {
        return await transactionalEntityManager.save(entityClass, data);
      });

      console.log('SAVE PRIMARY: ', primaryResult);

      // Passo 2: Cria uma cópia exata do resultado, incluindo timestamps
      const exactCopy = this.dataSources[0].getRepository(entityClass).manager.create(entityClass, {
        ...primaryResult,
      });

      // Passo 3: Salva nos bancos secundários com transações
      const secondaryResults = await Promise.all(
        this.dataSources.slice(1).map(async (db, index) => {
          try {
            const secondaryRepository = db.getRepository(entityClass).manager;
            const result = await secondaryRepository.transaction(async (transactionalEntityManager) => {
              return await transactionalEntityManager
                .createQueryBuilder()
                .insert()
                .into(entityClass)
                .values(exactCopy)
                .execute();
            });
            return { ...exactCopy, dbIndex: index + 1 }; // Opcional: identificar o DB secundário
          } catch (error) {
            console.error(`Erro ao salvar no DB secundário ${index + 1}: ${(error as Error).message}`);
            throw error;
          }
        })
      );

      return [primaryResult, ...secondaryResults] as Entity[];
    } catch (error) {
      console.error(`Erro ao salvar com transação: ${(error as Error).message}`);
      throw new Error(`Falha ao salvar nos bancos de dados: ${(error as Error).message}`);
    }
  }

  /**
   * Executa uma transação na base de dados selecionada
   * @param runInTransaction Função callback que será executada dentro da transação
   * @param options Opções da transação (isolationLevel, timeout, etc.)
   * @returns Promise com o resultado da transação
   */
  async transaction<T>(
    runInTransaction: TransactionCallback<T>,
    options?: TransactionOptions
  ): Promise<T> {
    const dataSource = this.getDB();
    const queryRunner: QueryRunner = dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction(options?.isolationLevel);

    try {
      // Criar o EntityManager transacional
      const transactionalEntityManager = queryRunner.manager;

      // Executar a função callback com o manager transacional
      const result = await runInTransaction(transactionalEntityManager);

      // Se chegou até aqui, commit da transação
      await queryRunner.commitTransaction();

      return result;
    } catch (error) {
      // Em caso de erro, rollback da transação
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Sempre liberar o queryRunner
      await queryRunner.release();
    }
  }

  /**
   * Versão com timeout personalizado
   */
  async transactionWithTimeout<T>(
    runInTransaction: TransactionCallback<T>,
    timeoutMs: number = 30000,
    isolationLevel?: IsolationLevel
  ): Promise<T> {
    return new Promise<T>(async (resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Transaction timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      try {
        const result = await this.transaction(runInTransaction, { isolationLevel });
        clearTimeout(timeoutId);
        resolve(result);
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  /**
   * Versão alternativa usando o método nativo do DataSource
   * Mais simples, mas com menos controle
   */
  async simpleTransaction<T>(
    runInTransaction: TransactionCallback<T>,
    isolationLevel?: IsolationLevel
  ): Promise<T> {
    const dataSource = this.getDB();
    return dataSource.transaction(isolationLevel as any, runInTransaction);
  }

  /**
   * Atualiza um registro em um banco de dados automaticamente selecionado ou específico.
   */
  /*async update<T extends ObjectLiteral>(
    entity: EntityTarget<T>,
    conditions: FindOptionsWhere<T>,
    data: Partial<T>,
    dbIndex?: number
  ): Promise<void> {
    const selectedDb = dbIndex ?? this.selectDb();
    this.validateDbIndex(selectedDb);
    
    return this.withConnectionTracking(selectedDb, () => {
      const repository = this.dataSources[selectedDb].getRepository<T>(entity);
      return repository.update(conditions, data);
    });
  }*/

  /**
   * Remove um registro em um banco de dados automaticamente selecionado ou específico.
   */


  /**
   * Altera a estratégia de seleção de banco de dados
   */
  setStrategy(strategy: SelectorStrategy): void {
    this.strategy = strategy;
  }
}