import { readFile, writeFile } from 'node:fs/promises';
const a = JSON.parse(await readFile(new URL('./budget-assumptions.json', import.meta.url), 'utf8'));
for (const key of ['active_households', 'planning_thb_per_usd', 'illustrative_household_price_thb']) {
  if (!Number.isFinite(a[key]) || a[key] <= 0) throw new Error(`Invalid planning assumption: ${key}`);
}
const round = value => Math.round((value + Number.EPSILON) * 100) / 100;
const electricity = a.local_host_watts / 1000 * a.local_host_hours_per_day * a.local_host_days_per_month * a.assumed_thb_per_kwh;
const labor = a.maintenance_hours_total_per_month * a.assumed_maintenance_thb_per_hour;
function scenario(name, infrastructure, ai) {
  const cashBeforeContingency = infrastructure + a.backup_storage_allowance_thb + ai;
  const cash = cashBeforeContingency * (1 + a.cash_contingency_fraction);
  const economic = cash + labor;
  return {
    name, currency: 'THB/month', cash_before_contingency: round(cashBeforeContingency),
    contingency: round(cash - cashBeforeContingency), cash_budget: round(cash),
    maintenance_value: round(labor), economic_cost: round(economic),
    cash_per_household: round(cash / a.active_households),
    illustrative_revenue: round(a.active_households * a.illustrative_household_price_thb),
    cash_break_even_households: Math.ceil(cash / a.illustrative_household_price_thb),
    economic_break_even_households: Math.ceil(economic / a.illustrative_household_price_thb),
  };
}
const cloud = a.cloud_app_vm_usd_per_month * (1 + a.cloud_weekly_vm_backup_fraction) * a.planning_thb_per_usd;
const result = {
  as_of: a.as_of, classification: a.classification, source: 'budget-assumptions.json',
  local_electricity: round(electricity), cloud_vm_and_weekly_backup_usd: round(a.cloud_app_vm_usd_per_month * (1 + a.cloud_weekly_vm_backup_fraction)),
  scenarios: [
    scenario('Local + optional AI allocation', electricity, a.ai_monthly_allocation_thb),
    scenario('Cloud app/database + local Course CI + optional AI allocation', electricity + cloud, a.ai_monthly_allocation_thb),
    scenario('Local, AI disabled', electricity, 0),
    scenario('Cloud app/database + local Course CI, AI disabled', electricity + cloud, 0),
  ],
};
if (process.argv.includes('--write')) await writeFile(new URL('./budget-estimate.json', import.meta.url), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
