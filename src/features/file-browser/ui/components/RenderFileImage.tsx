import {
  Folder,
  InsertDriveFileOutlined,
  InsertPhotoOutlined,
  DescriptionOutlined,
} from '@mui/icons-material';
import 'dayjs/locale/pl';
import type { FileBrowserItem } from '@/shared/model/types';
import { getFileType } from '@/shared/lib/fileUtils';

export const RenderFileImage = ({ file }: { file: FileBrowserItem }) => {
  if (file.type === 'folder')
    return <Folder color={file.isSystem ? 'primary' : 'inherit'} />;
  const fileType = getFileType(file.name);
  // if(fileType === 'pdf') return <PictureAsPdfOutlined/>
  // if (fileType === 'pdf') return <PdfIcon width={24} height={24} />;
  if (fileType === 'pdf') return <DescriptionOutlined />;
  if (fileType === 'image') return <InsertPhotoOutlined />;
  if (fileType === 'text') return <DescriptionOutlined />;
  if (fileType === 'word') return <DescriptionOutlined />;
  return <InsertDriveFileOutlined />;
};
