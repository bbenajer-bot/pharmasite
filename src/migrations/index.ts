import * as migration_20261005_172544_initial from './20261005_172544_initial';

export const migrations = [
  {
    up: migration_20261005_172544_initial.up,
    down: migration_20261005_172544_initial.down,
    name: '20261005_172544_initial'
  },
];
