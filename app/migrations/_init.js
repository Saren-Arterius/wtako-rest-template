exports.up = async (knex, Promise) => {
  const currentUnixMSRaw = knex.raw("ROUND(EXTRACT(EPOCH FROM NOW() AT TIME ZONE 'UTC') * 1000)");
  const uuidRaw = knex.raw('uuid_generate_v4()');
  await knex.schema.createTable('article', (table) => {
    table.string('id').primary().defaultTo(uuidRaw);
    table.string('origin', 32).notNullable();
    table.string('language', 2).notNullable();
    table.string('title', 1024).notNullable();
    table.string('article_url', 1024).unique().notNullable();
    table.string('thumbnail_url', 1024);
    table.bigInteger('published_at').notNullable();
    table.bigInteger('created_at').notNullable().defaultTo(currentUnixMSRaw);
    table.index('created_at');
  });
};

exports.down = async (knex, Promise) => {
  await knex.schema.dropTable('article');
};
