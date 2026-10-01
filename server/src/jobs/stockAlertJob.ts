import cron from 'node-cron';
import InventoryItem, { IInventoryItem } from '../models/InventoryItem';
import StockAlert from '../models/StockAlert';
import { sendLowStockAlert, LowStockItem } from '../services/email';

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

// ── Core job logic (exported for unit-testing) ────────────────────────────────
export async function runStockAlertJob(): Promise<void> {
  console.log('[StockAlertJob] Running stock check…');

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.warn('[StockAlertJob] ADMIN_EMAIL not set — skipping email send.');
  }

  try {
    // Find all items below their threshold
    const lowStockItems = await InventoryItem.find({
      $expr: { $lt: ['$stockQuantity', '$threshold'] },
    }).lean<{ _id: unknown; name: string; category: string; stockQuantity: number; threshold: number }[]>();

    if (lowStockItems.length === 0) {
      console.log('[StockAlertJob] All items are sufficiently stocked.');
      return;
    }

    const alertsToSend: LowStockItem[] = [];
    const cutoff = new Date(Date.now() - TWENTY_FOUR_HOURS);

    for (const item of lowStockItems) {
      // Check if we already sent an alert for this item in the last 24 h
      const recentAlert = await StockAlert.findOne({
        inventoryItemId: item._id,
        sentAt: { $gte: cutoff },
      });

      if (recentAlert) {
        console.log(
          `[StockAlertJob] Skipping "${item.name}" — alert sent recently.`
        );
        continue;
      }

      // Persist alert record
      await StockAlert.create({
        inventoryItemId: item._id,
        itemName: item.name,
        stockAtAlert: item.stockQuantity,
        threshold: item.threshold,
        emailSent: false,
        sentAt: new Date(),
      });

      alertsToSend.push({
        itemName: item.name,
        category: item.category,
        stockQuantity: item.stockQuantity,
        threshold: item.threshold,
      });
    }

    if (alertsToSend.length === 0) {
      console.log('[StockAlertJob] No new alerts to send.');
      return;
    }

    if (adminEmail) {
      await sendLowStockAlert(adminEmail, alertsToSend);
      // Mark all newly created alerts as email-sent
      await StockAlert.updateMany(
        {
          inventoryItemId: { $in: lowStockItems.map((i) => i._id) },
          emailSent: false,
          sentAt: { $gte: cutoff },
        },
        { emailSent: true }
      );
      console.log(
        `[StockAlertJob] Low-stock email sent for ${alertsToSend.length} item(s).`
      );
    }
  } catch (err) {
    console.error('[StockAlertJob] Error:', (err as Error).message);
  }
}

// ── Schedule ──────────────────────────────────────────────────────────────────
export function startStockAlertJob(): void {
  const schedule = process.env.CRON_SCHEDULE || '*/30 * * * *';

  if (!cron.validate(schedule)) {
    console.error(
      `[StockAlertJob] Invalid CRON_SCHEDULE: "${schedule}". Job not started.`
    );
    return;
  }

  cron.schedule(schedule, runStockAlertJob);
  console.log(`[StockAlertJob] Scheduled with pattern: "${schedule}"`);
}
