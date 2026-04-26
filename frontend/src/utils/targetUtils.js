export const getStaffTargets = () => {
  try {
    const targets = localStorage.getItem('staff_targets_v2');
    return targets ? JSON.parse(targets) : {};
  } catch (e) {
    console.error("Failed to parse staff targets", e);
    return {};
  }
};

export const saveStaffTarget = (username, month, year, target) => {
  const targets = getStaffTargets();
  const key = `${year}-${month}`;
  if (!targets[username]) targets[username] = {};
  targets[username][key] = target;
  localStorage.setItem('staff_targets_v2', JSON.stringify(targets));
};

export const getTargetForUser = (username, month, year) => {
  const targets = getStaffTargets();
  const key = `${year}-${month}`;
  return (targets[username] && targets[username][key]) || 0;
};
