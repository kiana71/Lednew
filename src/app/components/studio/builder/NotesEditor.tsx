
import React, { useState } from 'react';
import { RichTextEditor } from './RichTextEditor';

export function NotesEditor() {
  const [notes, setNotes] = useState<string>('<p>Please verify all site dimensions before installation.</p><p>Ensure power and data are available at the specified locations.</p>');

  return (
    <div className="flex flex-col h-full">
      <RichTextEditor 
        content={notes}
        onChange={setNotes}
      />
      <div className="text-xs text-muted-foreground mt-1 text-right">
        {notes.replace(/<[^>]*>/g, '').length} characters
      </div>
    </div>
  );
}
