import * as migration_20261005_172544_initial from './20261005_172544_initial';
import * as migration_20261005_220716_site_settings from './20261005_220716_site_settings';
import * as migration_20261006_045506_products_categories from './20261006_045506_products_categories';
import * as migration_20261006_051102_orders_shop_settings from './20261006_051102_orders_shop_settings';
import * as migration_20261019_194234_media_source_url from './20261019_194234_media_source_url';

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
  {
    up: migration_20261006_045506_products_categories.up,
    down: migration_20261006_045506_products_categories.down,
    name: '20261006_045506_products_categories',
  },
  {
    up: migration_20261006_051102_orders_shop_settings.up,
    down: migration_20261006_051102_orders_shop_settings.down,
    name: '20261006_051102_orders_shop_settings',
  },
  {
    up: migration_20261019_194234_media_source_url.up,
    down: migration_20261019_194234_media_source_url.down,
    name: '20261019_194234_media_source_url'
  },
];
