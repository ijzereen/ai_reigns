// src/components/story/CustomNode.jsx
// (이전 custom_node_jsx_v5_minimal_type_display_151200 문서의 코드와 동일)
import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

const gameLogicTypeDisplayInfo = {
  STORY: { label: '스토리', icon: '📖', color: 'bg-blue-50', borderColor: 'border-blue-300', textColor: 'text-blue-800' },
  QUESTION: { label: '객관식', icon: '❓', color: 'bg-green-50', borderColor: 'border-green-300', textColor: 'text-green-800' },
  QUESTION_INPUT: { label: '주관식', icon: '✍️', color: 'bg-yellow-50', borderColor: 'border-yellow-300', textColor: 'text-yellow-800' },
  input: { label: '시작', icon: '🏁', color: 'bg-emerald-50', borderColor: 'border-emerald-400', textColor: 'text-emerald-800' },
  output: { label: '종료', icon: '🛑', color: 'bg-rose-50', borderColor: 'border-rose-400', textColor: 'text-rose-800' },
  default: { label: '일반', icon: '📄', color: 'bg-gray-100', borderColor: 'border-gray-300', textColor: 'text-gray-800' },
};

const CustomNode = ({ data, selected, type }) => {
  const logicType = data.type || 'default';
  const displayInfo = gameLogicTypeDisplayInfo[logicType] || gameLogicTypeDisplayInfo.default;

  return (
    <div 
      className={`w-60 rounded-lg shadow-md border text-gray-800 transition-all duration-150
        ${selected ? 'z-50 border-teal-500 ring-4 ring-teal-400 shadow-2xl' : 'z-10'}
        ${displayInfo.borderColor} bg-white font-sans`}
      style={{ position: 'relative' }}
      title={`노드: ${data.label || '(제목 없음)'}\n타입: ${displayInfo.label}`}
    >
      <Handle type="target" position={Position.Left} className="!w-2.5 !h-2.5 !bg-gray-400 hover:!bg-teal-500 !border-none !rounded-full" />
      <Handle type="source" position={Position.Right} className="!w-2.5 !h-2.5 !bg-gray-400 hover:!bg-teal-500 !border-none !rounded-full" />
      <div className={`px-3 py-2 flex items-center justify-between border-b ${displayInfo.borderColor} border-opacity-60`}>
        <div className="flex items-center min-w-0">
          <span className={`text-base mr-1.5 ${displayInfo.textColor}`}>{displayInfo.icon}</span>
          <p className={`text-sm font-semibold truncate ${displayInfo.textColor}`} title={data.label}>{data.label || '(제목 없음)'}</p>
        </div>
        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${displayInfo.textColor} bg-black bg-opacity-5`}>{displayInfo.label}</span>
      </div>
      <div className="p-3 text-sm space-y-1.5">
        {data.imageUrl ? (
          <div className="w-full h-28 bg-gray-200 rounded-md overflow-hidden mb-2 shadow-inner">
            <img src={data.imageUrl} alt={data.label || '노드 이미지'} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = `https://placehold.co/240x112/${displayInfo.bgColor.split('-')[1] || 'gray'}/FFFFFF?text=이미지&font=sans`; e.currentTarget.alt = '이미지 로드 실패';}} />
          </div>
        ) : (
          <div className="w-full h-10 bg-gray-100 border border-dashed border-gray-300 rounded-md flex items-center justify-center text-gray-400 text-xs mb-2">(이미지 없음)</div>
        )}
        {data.characterName && (<p className="text-xs text-teal-700 font-medium truncate" title={data.characterName}><span className="font-normal text-gray-500">캐릭터:</span> {data.characterName}</p>)}
        <p className="text-gray-600 text-xs leading-relaxed max-h-12 overflow-hidden line-clamp-3" title={data.text_content}>{data.text_content || '(내용이 없습니다)'}</p>
      </div>
    </div>
  );
};
export default memo(CustomNode);
