import { DataSource, DataSourceOptions, EntitySchema, EntityTarget, MixedList, Repository } from "typeorm"
import { config } from "./index.js";
import { Users } from "../../domain/entities/users.entity.js";
import { Streamers } from "../../domain/entities/streamers.entity.js";
import { Payment } from "../../domain/entities/payment.entity.js";
import { Lives } from "../../domain/entities/lives.entity.js";
import { Clip } from "../../domain/entities/clip.entity.js";
import {UserStreamerFollow} from "../../domain/entities/user_stramer_follows.entity.js"

export let primaryEntities: MixedList<string | Function | EntitySchema<any>> | undefined = [
    Users,
    Streamers,
    Payment,
    Lives,
    Clip,
    UserStreamerFollow
  ]