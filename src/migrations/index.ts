import * as migration_20261005_172544_initial from './20261005_172544_initial'
import * as migration_20261005_220716_site_settings from './20261005_220716_site_settings'

export const migrations = [
  {
    up: migration_20261005_172544_initial.up,
    down: migration_20261005_172544_initial.down,
    name: '20261005_172544_initial',
  },
  {
    up: migration_20261005_220716_site_settings.up,
    down: migration_20261005_220716_site_settings.down,
    name: '20261005_220716_site_settings',
  },
]
