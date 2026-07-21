export interface StorageItemDTO {
  id?: string | null;
  name: string;
  created_at?: string | null;
  metadata?: {
    size?: number;
    mimetype?: string;
  } | null;
}