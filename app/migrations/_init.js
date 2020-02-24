exports.up = async (knex, Promise) => {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "bktree"');
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "pgroonga"');
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "cube"');
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "earthdistance"');

  const currentUnixMSRaw = knex.raw("ROUND(EXTRACT(EPOCH FROM NOW() AT TIME ZONE 'UTC') * 1000)");
  const uuidRaw = knex.raw('uuid_generate_v4()');

  await knex.schema.createTable('article', (table) => {
    table.string('id').primary().defaultTo(uuidRaw);
    table.string('title', 32).notNullable();
    table.text('content').notNullable();
    table.bigInteger('created_at').notNullable().defaultTo(currentUnixMSRaw);
    table.index('created_at');
  });
  await knex.raw('CREATE INDEX article_pgroonga_idx ON article USING PGroonga((ARRAY[article.title, article.content]))');

  await knex.schema.createTable('comment', (table) => {
    table.string('id').primary().defaultTo(uuidRaw);
    table.string('article_id').references('id').inTable('article').onUpdate('CASCADE').onDelete('CASCADE');
    table.text('content').notNullable();
    table.enum('side', ['BLUE', 'YELLOW']);
    table.specificType('location', 'POINT').notNullable();
    table.bigInteger('created_at').notNullable().defaultTo(currentUnixMSRaw);
    table.index('created_at');
    table.index('content', null, 'pgroonga');
  });
  await knex.raw('CREATE INDEX location_idx ON comment USING spgist(location)');
};

exports.down = async (knex, Promise) => {
  await knex.schema.dropTable('article');
  await knex.schema.dropTable('comment');
};
