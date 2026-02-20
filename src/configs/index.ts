import plugin from '../plugin';
import { createConfig, createRecommended } from '../utils/config';

export const configs = {
  'recommended': createRecommended(plugin, '@rotki', false),
  'recommended-flat': createRecommended(plugin, '@rotki', true),
  'strict': createConfig(plugin, '@rotki', false, 'strict'),
  'strict-flat': createConfig(plugin, '@rotki', true, 'strict'),
  'stylistic': createConfig(plugin, '@rotki', false, 'stylistic'),
  'stylistic-flat': createConfig(plugin, '@rotki', true, 'stylistic'),
};
