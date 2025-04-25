import { createErrorCodes } from '@cdziv/devkit-error';

const DDD_MODULE_NAME = 'ddd' as const;
const DDD_ERROR_SOURCES = ['argument-invalid'] as const;

export const DDD_ERROR_CODES = createErrorCodes(DDD_ERROR_SOURCES, {
  moduleName: DDD_MODULE_NAME,
});
