import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import EditNoteIcon from '@mui/icons-material/EditNote';
import { TextStyleKit } from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import type { Editor } from '@tiptap/react';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  FormatAlignCenter,
  FormatAlignLeft,
  FormatAlignRight,
  FormatBold,
  FormatItalic,
  FormatListBulleted,
  FormatListNumbered,
  FormatPaint,
  FormatStrikethrough,
  FormatUnderlined,
  HorizontalRule,
  Redo,
  Undo,
} from '@mui/icons-material';
import {
  Box,
  CircularProgress,
  Divider,
  IconButton,
  Stack,
  ToggleButton,
  Tooltip,
  Typography,
} from '@mui/material';
import { useState, useEffect } from 'react';

const MenuBar = ({ editor }: { editor: Editor }) => {
  // Read the current editor's state, and re-render the component when it changes
  const editorState = useEditorState({
    editor,
    selector: (ctx) => {
      return {
        isBold: ctx.editor.isActive('bold') ?? false,
        canBold: ctx.editor.can().chain().toggleBold().run() ?? false,
        isItalic: ctx.editor.isActive('italic') ?? false,
        canItalic: ctx.editor.can().chain().toggleItalic().run() ?? false,
        isStrike: ctx.editor.isActive('strike') ?? false,
        canStrike: ctx.editor.can().chain().toggleStrike().run() ?? false,
        isUnderline: ctx.editor.isActive('underline') ?? false,
        canUnderline: ctx.editor.can().chain().toggleUnderline().run() ?? false,
        isHighlight: ctx.editor.isActive('highlight') ?? false,
        canHighlight: ctx.editor.can().chain().toggleHighlight().run() ?? false,
        isHeading1: ctx.editor.isActive('heading', { level: 1 }) ?? false,
        isHeading2: ctx.editor.isActive('heading', { level: 2 }) ?? false,
        isHeading3: ctx.editor.isActive('heading', { level: 3 }) ?? false,
        isBulletList: ctx.editor.isActive('bulletList') ?? false,
        isOrderedList: ctx.editor.isActive('orderedList') ?? false,
        isAlignLeft: ctx.editor.isActive({ textAlign: 'left' }) ?? false,
        isAlignCenter: ctx.editor.isActive({ textAlign: 'center' }) ?? false,
        isAlignRight: ctx.editor.isActive({ textAlign: 'right' }) ?? false,
        canUndo: ctx.editor.can().chain().undo().run() ?? false,
        canRedo: ctx.editor.can().chain().redo().run() ?? false,
      };
    },
  });

  const buttonsCommonStyle = {
    p: 0.6,
    border: 'none',
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        mb: 0.5,
        flexWrap: 'wrap',
        columnGap: 0.2,
        rowGap: 0.5,
      }}
    >
      {/* Headers */}
      <Tooltip placement="top" title="Nagłówek 1">
        <ToggleButton
          size="small"
          value="h1"
          selected={editorState.isHeading1}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          sx={buttonsCommonStyle}
        >
          H1
        </ToggleButton>
      </Tooltip>

      <Tooltip placement="top" title="Nagłówek 2">
        <ToggleButton
          size="small"
          value="h2"
          selected={editorState.isHeading2}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          sx={buttonsCommonStyle}
        >
          H2
        </ToggleButton>
      </Tooltip>

      <Tooltip placement="top" title="Nagłówek 3">
        <ToggleButton
          size="small"
          value="h3"
          selected={editorState.isHeading3}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          sx={buttonsCommonStyle}
        >
          H3
        </ToggleButton>
      </Tooltip>

      <Divider flexItem orientation="vertical" sx={{ mx: 0.5 }} />

      {/* Text Formatting */}
      <Tooltip placement="top" title="Pogrubienie">
        <span>
          <ToggleButton
            size="small"
            value="bold"
            selected={editorState.isBold}
            disabled={!editorState.canBold}
            onClick={() => editor.chain().focus().toggleBold().run()}
            sx={buttonsCommonStyle}
          >
            <FormatBold fontSize="small" />
          </ToggleButton>
        </span>
      </Tooltip>

      <Tooltip placement="top" title="Kursywa">
        <span>
          <ToggleButton
            size="small"
            value="italic"
            selected={editorState.isItalic}
            disabled={!editorState.canItalic}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            sx={buttonsCommonStyle}
          >
            <FormatItalic fontSize="small" />
          </ToggleButton>
        </span>
      </Tooltip>

      <Tooltip placement="top" title="Przekreślenie">
        <span>
          <ToggleButton
            size="small"
            value="strike"
            selected={editorState.isStrike}
            disabled={!editorState.canStrike}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            sx={buttonsCommonStyle}
          >
            <FormatStrikethrough fontSize="small" />
          </ToggleButton>
        </span>
      </Tooltip>

      <Tooltip placement="top" title="Podkreślenie">
        <span>
          <ToggleButton
            size="small"
            value="underline"
            selected={editorState.isUnderline}
            disabled={!editorState.canUnderline}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            sx={buttonsCommonStyle}
          >
            <FormatUnderlined fontSize="small" />
          </ToggleButton>
        </span>
      </Tooltip>

      <Tooltip placement="top" title="Wyróżnienie">
        <span>
          <ToggleButton
            size="small"
            value="highlight"
            selected={editorState.isHighlight}
            disabled={!editorState.canHighlight}
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            sx={buttonsCommonStyle}
          >
            <FormatPaint fontSize="small" />
          </ToggleButton>
        </span>
      </Tooltip>

      <Divider flexItem orientation="vertical" sx={{ mx: 0.5 }} />

      {/* Text Alignment */}
      <Tooltip placement="top" title="Wyrównaj do lewej">
        <ToggleButton
          size="small"
          value="alignLeft"
          selected={editorState.isAlignLeft}
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          sx={buttonsCommonStyle}
        >
          <FormatAlignLeft fontSize="small" />
        </ToggleButton>
      </Tooltip>

      <Tooltip placement="top" title="Wyśrodkuj">
        <ToggleButton
          size="small"
          value="alignCenter"
          selected={editorState.isAlignCenter}
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          sx={buttonsCommonStyle}
        >
          <FormatAlignCenter fontSize="small" />
        </ToggleButton>
      </Tooltip>

      <Tooltip placement="top" title="Wyrównaj do prawej">
        <ToggleButton
          size="small"
          value="alignRight"
          selected={editorState.isAlignRight}
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          sx={buttonsCommonStyle}
        >
          <FormatAlignRight fontSize="small" />
        </ToggleButton>
      </Tooltip>

      <Divider flexItem orientation="vertical" sx={{ mx: 0.5 }} />

      {/* Lists */}
      <Tooltip placement="top" title="Lista punktowana">
        <ToggleButton
          size="small"
          value="bulletList"
          selected={editorState.isBulletList}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          sx={buttonsCommonStyle}
        >
          <FormatListBulleted fontSize="small" />
        </ToggleButton>
      </Tooltip>

      <Tooltip placement="top" title="Lista numerowana">
        <ToggleButton
          size="small"
          value="orderedList"
          selected={editorState.isOrderedList}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          sx={buttonsCommonStyle}
        >
          <FormatListNumbered fontSize="small" />
        </ToggleButton>
      </Tooltip>

      <Tooltip placement="top" title="Linia pozioma">
        <ToggleButton
          size="small"
          value="line"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          sx={buttonsCommonStyle}
        >
          <HorizontalRule fontSize="small" />
        </ToggleButton>
      </Tooltip>

      <Divider flexItem orientation="vertical" sx={{ mx: 0.5 }} />

      {/* History */}
      <Tooltip placement="top" title="Cofnij">
        <span>
          <ToggleButton
            size="small"
            value="undo"
            disabled={!editorState.canUndo}
            onClick={() => editor.chain().focus().undo().run()}
            sx={buttonsCommonStyle}
          >
            <Undo fontSize="small" />
          </ToggleButton>
        </span>
      </Tooltip>

      <Tooltip placement="top" title="Ponów">
        <span>
          <ToggleButton
            size="small"
            value="redo"
            disabled={!editorState.canRedo}
            onClick={() => editor.chain().focus().redo().run()}
            sx={buttonsCommonStyle}
          >
            <Redo fontSize="small" />
          </ToggleButton>
        </span>
      </Tooltip>
    </Box>
  );
};

interface NoteProps {
  content: string;
  onSave: (note: string) => void;
  loading?: boolean;
}

export const Note = ({ content, onSave, loading = false }: NoteProps) => {
  const [editNote, setEditNote] = useState(false);
  const [note, setNote] = useState(content ?? '');

  useEffect(() => {
    if (content !== undefined) {
      setNote(content || '');
    } else {
      setNote('');
    }
  }, [content]);

  const handleSaveNote = async () => {
    setEditNote(false);
    onSave(note);
  };

  const handleCancelEdit = () => {
    setEditNote(false);
    setNote(content ?? '');
  };

  return (
    <Box className="rounded-lg border border-dashed border-gray-300 bg-white">
      <Stack
        direction="row"
        alignItems={'center'}
        sx={{ width: '100%', mb: 2, pt: 2, px: 2 }}
        spacing={2}
      >
        <Typography
          variant="body1"
          className="font-medium"
          sx={{
            alignSelf: 'flex-start',
          }}
        >
          Notatka:
        </Typography>
        <Stack
          direction="row"
          sx={{ width: '100%' }}
          justifyContent={'flex-end'}
          alignItems="center"
          spacing={2}
        >
          {editNote && (
            <Tooltip title="Zapisz notatkę">
              <IconButton
                onClick={handleSaveNote}
                size="small"
                color="success"
                className="rounded-full border border-green-500 bg-green-50/50"
                disabled={loading || !editNote}
              >
                <CheckIcon />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title={editNote ? 'Anuluj' : 'Edytuj notatkę'}>
            <IconButton
              size="small"
              onClick={editNote ? handleCancelEdit : () => setEditNote(true)}
              color={!editNote ? 'primary' : 'inherit'}
              className={`rounded-lg border ${editNote ? 'border-red-500 bg-red-50/50' : ''}`}
            >
              {editNote ? (
                <CloseIcon className="text-red-400" />
              ) : (
                <EditNoteIcon />
              )}
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>
      <Box
        sx={{
          pb: 2,
          px: { xs: 1, sm: 2 },
        }}
      >
        <NoteBase
          renderToolbar={editNote}
          content={note}
          onChange={(newNote) => setNote(newNote)}
          editable={editNote}
          loading={loading}
        />
      </Box>
    </Box>
  );
};

interface NoteBaseProps {
  content: string;
  onChange: (content: string) => void;
  editable: boolean;
  renderToolbar?: boolean;
  loading?: boolean;
}

export const NoteBase = ({
  content,
  onChange,
  editable,
  renderToolbar = true,
  loading = false,
}: NoteBaseProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          HTMLAttributes: {
            class: 'list-disc ml-3',
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: 'list-decimal ml-3',
          },
        },
      }),
      TextStyleKit,
      Highlight,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    editorProps: {
      attributes: {
        class: 'rounded-sm border border-gray-300 bg-white px-2 py-1 note',
        spellcheck: 'false',
      },
    },
    editable: editable,
    content: content || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor) {
      editor.setEditable(editable);
    }
  }, [editor, editable]);

  useEffect(() => {
    if (editor && content !== undefined) {
      const currentContent = editor.getHTML();
      if (content !== currentContent) {
        editor.commands.setContent(content || '');
      }
    }
  }, [editor, content]);

  return loading ? (
    <Box
      className="note rounded-sm border border-gray-300 bg-white px-2 py-1"
      sx={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <CircularProgress />
    </Box>
  ) : (
    <>
      {renderToolbar && <MenuBar editor={editor} />}

      <EditorContent editor={editor} />
    </>
  );
};
