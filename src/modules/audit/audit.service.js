import AuditLog from "./audit.model.js";

export const logAction = async ({
  userId,
  action,
  entity,
  entityId,
  metadata,
}) => {
  await AuditLog.create({
    user: userId,
    action,
    entity,
    entityId,
    metadata,
  });
};
