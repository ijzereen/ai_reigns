import React, { useState } from 'react';
import './SettingsPage.css';

interface Character {
  name: string;
  description: string;
}

interface SettingsPageProps {
  onBack?: () => void;
  onNext?: () => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onBack, onNext }) => {
  const [storyPlot, setStoryPlot] = useState('');
  const [characters, setCharacters] = useState<Character[]>([
    { name: '', description: '' },
    { name: '', description: '' },
    { name: '', description: '' }
  ]);

  const handleCharacterChange = (index: number, field: 'name' | 'description', value: string) => {
    const newCharacters = [...characters];
    newCharacters[index][field] = value;
    setCharacters(newCharacters);
  };

  const handleCreateStory = (e: React.FormEvent) => {
    e.preventDefault();
    // 스토리 생성 로직 구현
    console.log('Story creation:', {
      storyPlot,
      characters
    });
    // 스토리 생성 후 에디터 페이지로 이동
    onNext?.();
  };

  return (
    <div className="settings-page">
      <div className="background-rectangle"></div>
      
      <div className="settings-container">
        <h1 className="settings-title">스토리 이름</h1>
        
        <form onSubmit={handleCreateStory} className="settings-form">
          <div className="story-plot-section">
            <label htmlFor="storyPlot">스토리 줄거리</label>
            <textarea
              id="storyPlot"
              value={storyPlot}
              onChange={(e) => setStoryPlot(e.target.value)}
              className="story-plot-input"
            />
          </div>

          <div className="characters-section">
            <h2 className="characters-title">등장인물</h2>
            
            <div className="characters-grid">
              <div className="character-names">
                {characters.map((character, index) => (
                  <input
                    key={`name-${index}`}
                    type="text"
                    placeholder="이름"
                    value={character.name}
                    onChange={(e) => handleCharacterChange(index, 'name', e.target.value)}
                    className="character-name-input"
                  />
                ))}
              </div>
              
              <div className="character-descriptions">
                {characters.map((character, index) => (
                  <input
                    key={`desc-${index}`}
                    type="text"
                    placeholder="설명"
                    value={character.description}
                    onChange={(e) => handleCharacterChange(index, 'description', e.target.value)}
                    className="character-desc-input"
                  />
                ))}
              </div>
            </div>
          </div>

          <button type="submit" className="create-story-button">
            스토리 생성하기
          </button>
        </form>
      </div>

      <footer className="footer">
        <p>2025 SeedCoop All Right Reversed</p>
      </footer>
    </div>
  );
};

export default SettingsPage; 