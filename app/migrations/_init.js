exports.up = async (knex, Promise) => {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "bktree"');
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "pgroonga"');

  const currentUnixMSRaw = knex.raw("ROUND(EXTRACT(EPOCH FROM NOW() AT TIME ZONE 'UTC') * 1000)");
  const uuidRaw = knex.raw('uuid_generate_v4()');

  await knex.schema.createTable('franchise', (table) => {
    table.string('id').primary().defaultTo(uuidRaw);
    table.string('title', 32).notNullable();
    table.text('description').notNullable();
    table.enum('side', ['BLUE', 'YELLOW']);
    table.bigInteger('created_at').notNullable().defaultTo(currentUnixMSRaw);
    table.string('created_by', 64).notNullable();
    table.index('title', null, 'pgroonga');
    table.index('description', null, 'pgroonga');
    table.index('created_at');
    table.index('created_by');
  });

  await knex.schema.createTable('place', (table) => {
    table.string('id').primary().defaultTo(uuidRaw);
    table.string('title', 32).notNullable();
    table.text('description').notNullable();
    table.string('franchise_id').references('id').inTable('franchise').onUpdate('CASCADE').onDelete('CASCADE');
    table.enum('side', ['BLUE', 'YELLOW']);
    table.specificType('location', 'POINT').notNullable();
    table.integer('vote_score').notNullable().defaultTo(0);
    table.bigInteger('created_at').notNullable().defaultTo(currentUnixMSRaw);
    table.string('created_by', 64).notNullable();
    table.index('created_at');
    table.index('created_by');
    table.index('vote_score');
    table.index('title', null, 'pgroonga');
    table.index('description', null, 'pgroonga');
  });
  await knex.raw('CREATE INDEX location_idx ON place USING spgist(location)');
  // select * from points where location <@ box '((2,7), (8,0))' ORDER BY vote_score DESC LIMIT 3;
  await knex.schema.createTable('comment', (table) => {
    table.string('id').primary().defaultTo(uuidRaw);
    table.string('franchise_id').references('id').inTable('place').onUpdate('CASCADE').onDelete('CASCADE');
    table.string('place_id').references('id').inTable('place').onUpdate('CASCADE').onDelete('CASCADE');
    table.text('message').notNullable();
    table.integer('vote_score').notNullable().defaultTo(0);
    table.bigInteger('created_at').notNullable().defaultTo(currentUnixMSRaw);
    table.string('created_by', 64).notNullable();
    table.index('created_at');
    table.index('created_by');
    table.index('vote_score');
    table.index('message', null, 'pgroonga');
  });
};

exports.down = async (knex, Promise) => {
  await knex.schema.dropTable('franchise');
  await knex.schema.dropTable('place');
  await knex.schema.dropTable('comment');
};
