import * as migration_20261105_075647_initial from './20261105_075647_initial';
import * as migration_20261105_082652_booking_confirmed_at from './20261105_082652_booking_confirmed_at';
import * as migration_20261105_103715_destination_page_content from './20261105_103715_destination_page_content';
import * as migration_20261105_120005_page_blocks_buttons_variant from './20261105_120005_page_blocks_buttons_variant';
import * as migration_20261105_142553_whatsapp_delivery from './20261105_142553_whatsapp_delivery';

export const migrations = [
  {
    up: migration_20261105_075647_initial.up,
    down: migration_20261105_075647_initial.down,
    name: '20261105_075647_initial',
  },
  {
    up: migration_20261105_082652_booking_confirmed_at.up,
    down: migration_20261105_082652_booking_confirmed_at.down,
    name: '20261105_082652_booking_confirmed_at',
  },
  {
    up: migration_20261105_103715_destination_page_content.up,
    down: migration_20261105_103715_destination_page_content.down,
    name: '20261105_103715_destination_page_content',
  },
  {
    up: migration_20261105_120005_page_blocks_buttons_variant.up,
    down: migration_20261105_120005_page_blocks_buttons_variant.down,
    name: '20261105_120005_page_blocks_buttons_variant',
  },
  {
    up: migration_20261105_142553_whatsapp_delivery.up,
    down: migration_20261105_142553_whatsapp_delivery.down,
    name: '20261105_142553_whatsapp_delivery'
  },
];
