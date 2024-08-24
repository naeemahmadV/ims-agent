import config from '../config';
import { Model } from 'objection';
import { knex } from 'knex';
import { logManager } from '../log-manager';
import { WebpackMigrationSource } from './WebpackMigrationSource';

let logger = logManager.getLogger('Database');

export async function connectAndSync() {
    let dbConfig = config.databaseConfig;
    logger.debug('Database dir is:' + dbConfig.outputPath);

    const knexInstance = knex({
        client: 'sqlite3',
        useNullAsDefault: true,
        connection: {
            filename: dbConfig.outputPath,
            database: dbConfig.database,
            user: dbConfig.username,
            password: dbConfig.password,
        },
        asyncStackTraces: true,
    });

        // Apply the encryption key once after the connection is established
        await knexInstance.raw(`PRAGMA key = '${dbConfig.key}';`)
        .then(() => {
            console.log('Database encrypted and connection secured.');
        })
        .catch(error => {
            console.error('Error setting encryption key: ', error);
        });


    // Give the knex instance to objection.
    Model.knex(knexInstance);

    await knexInstance.migrate.latest({
        migrationSource: new WebpackMigrationSource(require.context('../../migrations', true, /.js$/)),
    });
    return knexInstance;
}
