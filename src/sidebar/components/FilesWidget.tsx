import React, { useState, useEffect } from 'react';
import LauncherItem from './LauncherItem';

interface FilesWidgetProps {
    folder_path: string;
    max_count: number;
    layout?: 'vertical' | 'horizontal';
    isPreview?: boolean;
}

interface FileInfo {
    name: string;
    path: string;
}

const FilesWidget: React.FC<FilesWidgetProps> = ({ folder_path, max_count, layout = 'vertical', isPreview = false }) => {
    const [files, setFiles] = useState<FileInfo[]>([]);

    useEffect(() => {
        window.electronAPI.getFilesInFolder(folder_path, max_count)
            .then((fileList: FileInfo[]) => setFiles(fileList))
            .catch((err: Error) => console.error('获取文件列表失败:', err));
    }, [folder_path, max_count]);

    return (
        <div className={`launcher-group layout-${layout} compact-files`}>
            {files.map((file, index) => {
                let displayName = file.name;
                if (displayName.toLowerCase().endsWith('.lnk')) {
                    displayName = displayName.slice(0, -4);
                }
                return (
                    <LauncherItem
                        key={index}
                        name={displayName}
                        target={file.path}
                        isPreview={isPreview}
                    />
                );
            })}
        </div>
    );
};

export default FilesWidget;
