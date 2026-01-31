import { buildReferenceListsFromFolderData } from './referenceInitialization';

describe('buildReferenceListsFromFolderData', () => {
  it('splits deleted references into trash list', () => {
    const result = buildReferenceListsFromFolderData({
      refsData: [
        {
          reference: {
            id: 'r-active',
            ref_type: 'DOCUMENT',
            is_deleted: false,
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-01T00:00:00Z',
            folder_id: 'f-1',
          },
          documents: [{ id: 'd-1', title: 'Active title', metadata: '{}', size: 100 }],
        },
        {
          reference: {
            id: 'r-deleted',
            ref_type: 'DOCUMENT',
            is_deleted: true,
            created_at: '2025-01-02T00:00:00Z',
            updated_at: '2025-01-02T00:00:00Z',
            folder_id: 'f-1',
          },
          documents: [{ id: 'd-2', title: 'Deleted title', metadata: '{}', size: 200 }],
        },
      ],
      fallbackFolderId: 'f-1',
      collectionId: 'c-1',
    });

    expect(result.active.map((r: any) => r.id)).toEqual(['r-active']);
    expect(result.trashed.map((r: any) => r.id)).toEqual(['r-deleted']);
  });
});
