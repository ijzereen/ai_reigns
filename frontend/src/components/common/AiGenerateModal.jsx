// src/components/common/AiGenerateModal.jsx
// (이전 ai_generate_modal_jsx_v4_pre_backend_final_180300과 동일)
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const aiCreatableNodeTypes = [
  { value: 'STORY', label: '스토리 (다음 이야기 전개)' },
  { value: 'QUESTION', label: '질문 (객관식 선택지 생성)' },
];

function AiGenerateModal({ isOpen, currentNode, onClose, onSubmit }) {
  const [depth, setDepth] = useState(1);
  const [nodeType, setNodeType] = useState('STORY');
  const [prompt, setPrompt] = useState('');

  useEffect(() => { if (isOpen) { setDepth(1); setNodeType('STORY'); setPrompt(''); } }, [isOpen]);
  const handleSubmit = () => {
    if (!currentNode) { alert("AI 생성을 시작할 노드가 선택되지 않았습니다."); return; }
    onSubmit({ sourceNodeId: currentNode.id, sourceNodeData: currentNode.data, sourceNodeType: currentNode.data.type, generationOptions: { depth, nodeType, prompt } });
    onClose();
  };
  const modalVariants = { hidden: { opacity: 0, y: -50, scale: 0.95 }, visible: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: 50, scale: 0.95, transition: { duration: 0.2 } },};
  const backdropVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 },};
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div key="ai-backdrop" variants={backdropVariants} initial="hidden" animate="visible" exit="hidden"
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
          <motion.div key="ai-modal" variants={modalVariants} initial="hidden" animate="visible" exit="exit"
            className="bg-gray-800 text-gray-100 rounded-lg shadow-xl w-full max-w-lg p-6 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()} style={{ fontFamily: "'Inter', sans-serif" }}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-teal-400">AI로 다음 스토리 생성</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-200 text-2xl" aria-label="닫기">&times;</button>
            </div>
            <div className="flex-grow overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-700">
              <p className="text-sm text-gray-300">현재 선택된 노드: <strong className="text-teal-400">{currentNode?.data?.label || currentNode?.id}</strong> 에서 AI가 다음 이야기를 생성합니다.</p>
              <div>
                <label htmlFor="aiDepthModal" className="block text-sm font-medium text-gray-300 mb-1">생성 깊이 (단계 수)</label>
                <select id="aiDepthModal" value={depth} onChange={(e) => setDepth(parseInt(e.target.value, 10))}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-teal-500 focus:border-teal-500">
                  <option value={1}>1단계</option> <option value={2}>2단계</option> <option value={3}>3단계</option>
                </select>
              </div>
              <div>
                <label htmlFor="aiNodeTypeModal" className="block text-sm font-medium text-gray-300 mb-1">생성할 노드 타입</label>
                <select id="aiNodeTypeModal" value={nodeType} onChange={(e) => setNodeType(e.target.value)}
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-teal-500 focus:border-teal-500">
                  {aiCreatableNodeTypes.map(type => (<option key={type.value} value={type.value}>{type.label}</option>))}
                </select>
              </div>
              <div>
                <label htmlFor="aiPromptModal" className="block text-sm font-medium text-gray-300 mb-1">간단한 지시사항 / 키워드 (선택 사항)</label>
                <textarea id="aiPromptModal" value={prompt} onChange={(e) => setPrompt(e.target.value)} rows="3"
                  className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-teal-500 focus:border-teal-500 resize-none"
                  placeholder="예: 주인공이 위험한 함정에 빠지도록..."/>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-600 hover:bg-gray-500 rounded-md transition-colors">취소</button>
              <button onClick={handleSubmit} className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-md shadow-sm transition-colors">생성 요청</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
export default AiGenerateModal;
