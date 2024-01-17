import plugin from '../plugin';
import { createRecommended } from '../utils/config';

export const configs = {
  'recommended': createRecommended(plugin, '@rotki', false),
  'recommended-flat': createRecommended(plugin, '@rotki', true),
};
