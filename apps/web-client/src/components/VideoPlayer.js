import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Video Player Component with Watermark Overlay
 */
import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { getYouTubeEmbedUrl, ResourceType } from '@medical-portal/shared';
export default function VideoPlayer({ resource, lectureTitle }) {
    const containerRef = useRef(null);
    const [watermarkPosition, setWatermarkPosition] = useState({ x: 30, y: 20 });
    // Fetch watermark configuration
    const { data: watermarkData } = useQuery({
        queryKey: ['watermark'],
        queryFn: () => api.auth.watermark(),
    });
    const watermarkConfig = watermarkData?.data?.data?.config || null;
    // Update watermark position periodically for floating effect
    useEffect(() => {
        if (watermarkConfig?.position === 'random') {
            const interval = setInterval(() => {
                setWatermarkPosition({
                    x: Math.random() * 60 + 20,
                    y: Math.random() * 60 + 20,
                });
            }, 15000); // Change position every 15 seconds
            return () => clearInterval(interval);
        }
    }, [watermarkConfig]);
    const getVideoUrl = () => {
        if (resource.type === ResourceType.YOUTUBE) {
            return getYouTubeEmbedUrl(resource.url);
        }
        // For Google Drive videos
        if (resource.type === ResourceType.GDRIVE_VIDEO) {
            // Extract file ID from various Google Drive URL formats
            const match = resource.url.match(/\/d\/([a-zA-Z0-9_-]+)/);
            const fileId = match ? match[1] : resource.url;
            return `https://drive.google.com/file/d/${fileId}/preview`;
        }
        return resource.url;
    };
    return (_jsxs("div", { ref: containerRef, className: "watermark-container relative w-full aspect-video bg-black rounded-lg overflow-hidden", children: [_jsx("iframe", { src: getVideoUrl(), className: "w-full h-full", allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture", allowFullScreen: true, title: lectureTitle }), watermarkConfig && (_jsxs(_Fragment, { children: [_jsx("div", { className: "watermark-overlay watermark-animated", style: {
                            top: `${watermarkPosition.y}%`,
                            left: `${watermarkPosition.x}%`,
                            fontSize: `${watermarkConfig.fontSize || 14}px`,
                            opacity: watermarkConfig.opacity || 0.3,
                            color: watermarkConfig.color || 'rgba(255, 255, 255, 0.5)',
                            transform: `rotate(${watermarkConfig.rotation || -15}deg)`,
                        }, children: watermarkConfig.text }), _jsx("div", { className: "watermark-overlay", style: {
                            bottom: '10px',
                            right: '10px',
                            fontSize: '12px',
                            opacity: 0.4,
                            color: 'rgba(255, 255, 255, 0.6)',
                        }, children: watermarkConfig.email })] })), _jsx("div", { className: "absolute inset-0 pointer-events-none flex items-center justify-center opacity-0 hover:opacity-5 transition-opacity", children: _jsx("div", { className: "text-white text-4xl font-bold transform -rotate-45", children: watermarkConfig?.text || 'CONFIDENTIAL' }) })] }));
}
//# sourceMappingURL=VideoPlayer.js.map