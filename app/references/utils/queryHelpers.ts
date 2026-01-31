import { QueryClient } from '@tanstack/react-query';
import { ReferenceItem } from '@/types/reference-manager';
import { referenceKeys } from '@/lib/api/queries/reference-manager/keys';
import { referenceManagerService } from '@/lib/api/referenceManagerService';

/**
 * Invalidate the appropriate queries based on whether the reference belongs to a folder or is unsigned.
 * This pattern is used across multiple action hooks to refresh the correct data.
 */
export const invalidateReferenceQueries = async (
  queryClient: QueryClient,
  ref: ReferenceItem | null | undefined
): Promise<void> => {
  if (ref?.folderId) {
    await queryClient.invalidateQueries({
      queryKey: referenceKeys.documents(ref.folderId),
    });
  } else {
    // For unsigned references (no folderId), invalidate the unsigned query
    await queryClient.invalidateQueries({ queryKey: referenceKeys.unsigned() });
  }
};

/**
 * Resolve the actual reference ID from either a reference ID or document ID.
 * Some IDs may be document IDs that need to be resolved to their parent reference.
 */
export const resolveRefId = async (id: string): Promise<string> => {
  // First try to get as a reference
  try {
    const refResp = await referenceManagerService.getReference(id);
    if (refResp.success && refResp.data?.reference?.id) {
      return id;
    }
  } catch {
    // Not a valid reference ID, continue to check as document
  }

  // Try to get as a document and extract reference_id from metadata
  try {
    const resp = await referenceManagerService.getDocument(id, true);
    const doc: any = resp?.data?.document;
    if (resp.success && doc) {
      try {
        const meta = doc.metadata ? JSON.parse(doc.metadata) : {};
        if (meta.reference_id) return meta.reference_id;
      } catch {
        // Invalid metadata JSON, fall through
      }
    }
  } catch {
    // Not a valid document ID either
  }

  return id;
};

/**
 * Clean up existing documents attached to a reference before uploading a new one.
 * Prevents "Multiple rows found" errors when replacing documents.
 */
export const cleanupExistingDocuments = async (refId: string): Promise<void> => {
  try {
    const existingRef = await referenceManagerService.getReferenceWithDocuments(refId);
    // @ts-ignore - API response structure varies
    const docs = existingRef.data?.documents || existingRef.data?.reference?.documents;

    if (!existingRef.success) {
      console.warn('Failed to check existing documents, proceeding with caution...');
      return;
    }

    if (Array.isArray(docs) && docs.length > 0) {
      for (const doc of docs) {
        if (doc.id) {
          const delRes = await referenceManagerService.deleteDocument(doc.id);
          if (!delRes.success) {
            throw new Error(`Failed to delete document ${doc.id}`);
          }
        }
      }
    }
  } catch (cleanupErr) {
    console.error('Error cleaning up existing documents:', cleanupErr);
    throw cleanupErr;
  }
};
