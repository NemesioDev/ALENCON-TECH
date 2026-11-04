import { createClient } from '@supabase/supabase-js';
import ws from 'ws';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ejvxpwmnrivqgiyocyns.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  realtime: {
    transport: ws as any,
  },
});

export const BUCKET_PDFS = 'das-pdfs';
export const BUCKET_CERTIFICADOS = 'certificados-a1';

/**
 * Garante que os buckets de armazenamento de PDFs e Certificados existam no Supabase Storage
 */
export async function inicializarBucketsSupabase() {
  try {
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const nomes = (buckets || []).map((b) => b.name);

    if (!nomes.includes(BUCKET_PDFS)) {
      await supabaseAdmin.storage.createBucket(BUCKET_PDFS, {
        public: true,
        fileSizeLimit: 10 * 1024 * 1024,
      });
    }

    if (!nomes.includes(BUCKET_CERTIFICADOS)) {
      await supabaseAdmin.storage.createBucket(BUCKET_CERTIFICADOS, {
        public: false,
        fileSizeLimit: 10 * 1024 * 1024,
      });
    }
  } catch (err) {
    console.warn('Aviso ao verificar buckets do Supabase Storage:', err);
  }
}

/**
 * Faz upload de um PDF de guia DAS para o Supabase Storage e retorna a URL pública
 */
export async function uploadPdfParaSupabaseStorage(
  nomeArquivo: string,
  pdfBuffer: Buffer
): Promise<string> {
  try {
    await supabaseAdmin.storage.from(BUCKET_PDFS).upload(nomeArquivo, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    });

    const { data } = supabaseAdmin.storage.from(BUCKET_PDFS).getPublicUrl(nomeArquivo);
    return data?.publicUrl || '';
  } catch (err) {
    console.warn('Aviso ao enviar PDF para Supabase Storage:', err);
    return '';
  }
}
