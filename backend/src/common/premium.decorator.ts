import { SetMetadata } from '@nestjs/common';

/** Marks a route (or whole controller) as premium: requires a valid API key. */
export const PREMIUM_KEY = 'premium';
export const Premium = () => SetMetadata(PREMIUM_KEY, true);
