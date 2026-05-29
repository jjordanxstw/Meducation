import { SetMetadata } from '@nestjs/common';

export const SKIP_TIMEOUT_KEY = 'skipTimeout';

/** Exempt a handler/controller from the global request timeout (e.g. uploads). */
export const SkipTimeout = () => SetMetadata(SKIP_TIMEOUT_KEY, true);
