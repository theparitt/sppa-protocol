import { readFile } from 'node:fs/promises';
import { parseJSON, validate } from '../src/core.mjs';
import {validateNotificationDescriptor,validateNotificationEvent,validateNotificationBatch,validateCapabilityNotifications} from '../src/job-notifications.mjs';
const notificationChecks={'notification-descriptor':validateNotificationDescriptor,'notification-event':validateNotificationEvent,'notification-batch':validateNotificationBatch,'notification-capability':validateCapabilityNotifications};
const [schema, file] = process.argv.slice(2);
if (!schema || !file) { console.error('Usage: npm run validate -- <schema-name> <json-file>'); process.exit(2); }
try { const data=parseJSON(await readFile(file,'utf8'));if(notificationChecks[schema])notificationChecks[schema](data);else validate(schema,data); console.log(`${file}: valid ${schema} shape (semantic checks are separate)`); }
catch (error) { console.error(JSON.stringify(error.toJSON?.() ?? { message:error.message },null,2)); process.exitCode=1; }
