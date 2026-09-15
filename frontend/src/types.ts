export type ExtractedField = {
  id: string;
  page_number: number;
  field_name: string;
  field_value: string;
  field_type: string;
  confidence: number;
  is_edited: boolean;
};

export type ExtractedTable = {
  id: string;
  page_number: number;
  table_index: number;
  data_json: unknown[][];
};

export type Document = {
  id: string;
  original_filename: string;
  file_size: number;
  page_count: number;
  status: "processing" | "completed" | "failed";
  error_message: string | null;
  created_at: string;
  processed_at: string | null;
  fields: ExtractedField[];
  tables: ExtractedTable[];
};

export type Stats = {
  documents: number;
  pages: number;
  fields: number;
  tables: number;
  exports: number;
};

export type ExportRecord = {
  id: string;
  filename: string;
  document_count: number;
  created_at: string;
};

