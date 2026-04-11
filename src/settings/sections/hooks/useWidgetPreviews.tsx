import React from 'react';

import LauncherItem from '../../../sidebar/components/LauncherItem';
import VolumeWidget from '../../../sidebar/components/VolumeWidget';
import FilesWidget from '../../../sidebar/components/FilesWidget';
import DragToLaunchWidget from '../../../sidebar/components/DragToLaunchWidget';
import Toolbar from '../../../sidebar/components/Toolbar';
import ICCCeControl from '../../../sidebar/components/ICCCeControl';

interface LauncherItemPreviewProps {
    name: string;
    target: string;
    widgetIndex?: number;
    targetIndex?: number;
}

interface VolumeWidgetPreviewProps {
    range?: [number, number];
}

interface FilesWidgetPreviewProps {
    folder_path?: string;
    max_count?: number;
    layout?: string;
    widgetIndex?: number;
}

interface DragToLaunchWidgetPreviewProps {
    name?: string;
    targets?: string;
    widgetIndex?: number;
}

interface ToolbarWidgetPreviewProps {
    tools?: string[];
}

interface ICCCeControlPreviewProps {
    functions?: string[];
}

interface UseWidgetPreviewsReturn {
    LauncherItemPreview: React.FC<LauncherItemPreviewProps>;
    VolumeWidgetPreview: React.FC<VolumeWidgetPreviewProps>;
    FilesWidgetPreview: React.FC<FilesWidgetPreviewProps>;
    DragToLaunchWidgetPreview: React.FC<DragToLaunchWidgetPreviewProps>;
    ToolbarWidgetPreview: React.FC<ToolbarWidgetPreviewProps>;
    ICCCeControlPreview: React.FC<ICCCeControlPreviewProps>;
}

const LauncherItemPreview = React.memo<LauncherItemPreviewProps>(({ name, target, widgetIndex, targetIndex }) => {
    return (
        <LauncherItem
            name={name}
            target={target}
            isPreview={true}
        />
    );
});

const VolumeWidgetPreview = React.memo<VolumeWidgetPreviewProps>(({ range }) => {
    return (
        <VolumeWidget
            range={range}
            isPreview={true}
        />
    );
});

const FilesWidgetPreview = React.memo<FilesWidgetPreviewProps>(({ folder_path, max_count, layout = 'vertical', widgetIndex }) => {
    return (
        <FilesWidget
            folder_path={folder_path}
            max_count={max_count}
            layout={layout}
            isPreview={true}
        />
    );
});

const DragToLaunchWidgetPreview = React.memo<DragToLaunchWidgetPreviewProps>(({ name, targets, widgetIndex }) => {
    return (
        <DragToLaunchWidget
            name={name}
            targets={targets}
            isPreview={true}
            show_all_time={true}
        />
    );
});

const ToolbarWidgetPreview = React.memo<ToolbarWidgetPreviewProps>(({ tools = [] }) => {
    return (
        <Toolbar
            tools={tools}
            isPreview={true}
        />
    );
});

const ICCCeControlPreview = React.memo<ICCCeControlPreviewProps>(({ functions = [] }) => {
    return (
        <ICCCeControl
            functions={functions}
            isPreview={true}
        />
    );
});

const useWidgetPreviews = (): UseWidgetPreviewsReturn => {
    return {
        LauncherItemPreview,
        VolumeWidgetPreview,
        FilesWidgetPreview,
        DragToLaunchWidgetPreview,
        ToolbarWidgetPreview,
        ICCCeControlPreview
    };
};

export default useWidgetPreviews;
