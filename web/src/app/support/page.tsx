// Shim : la route vit dans le plugin (dash-super), le cœur ne fait que la
// ré-exporter (chargeur strict F1 : plugin inactif = 404 + journal).
export { default } from "@/plugins/dash-super/routes/support/page";
