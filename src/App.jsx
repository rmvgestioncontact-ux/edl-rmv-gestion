import React, { useState, useEffect, useRef } from 'react';
import { jsPDF } from 'jspdf';
import './App.css';

export default function App() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem('edlData');
    return saved ? JSON.parse(saved) : {
      inspectionType: 'entry',
      propertyAddress: '',
      tenantName: '',
      accessMode: '',
      rooms: {},
      meterReadings: { electricity: '', gas: '', water: '' },
      keysPhoto: null,
      signature: null,
    };
  });

  useEffect(() => {
    localStorage.setItem('edlData', JSON.stringify(formData));
  }, [formData]);

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="app">
      <header className="app-header">
        <img src="/images/header.png" alt="RMV GESTION" className="header-image" />
      </header>
      
      <nav className="step-nav">
        {[1, 2, 3, 4].map(step => (
          <button
            key={step}
            className={`step-btn ${currentStep === step ? 'active' : ''}`}
            onClick={() => setCurrentStep(step)}
          >
            Étape {step}
          </button>
        ))}
      </nav>

      <main className="step-container">
        {currentStep === 1 && <Step1 formData={formData} updateFormData={updateFormData} />}
        {currentStep === 2 && <Step2 formData={formData} updateFormData={updateFormData} />}
        {currentStep === 3 && <Step3 formData={formData} updateFormData={updateFormData} />}
        {currentStep === 4 && <Step4 formData={formData} updateFormData={updateFormData} />}
      </main>

      <div className="step-actions">
        {currentStep > 1 && <button onClick={() => setCurrentStep(currentStep - 1)}>← Retour</button>}
        {currentStep < 4 && <button onClick={() => setCurrentStep(currentStep + 1)}>Suivant →</button>}
      </div>
    </div>
  );
}

function Step1({ formData, updateFormData }) {
  return (
    <div className="step">
      <h2>Étape 1 : Informations du bien et locataire</h2>
      
      <label>Type d'inspection :</label>
      <select value={formData.inspectionType} onChange={(e) => updateFormData('inspectionType', e.target.value)}>
        <option value="entry">Entrée</option>
        <option value="exit">Sortie</option>
      </select>

      <label>Adresse du bien :</label>
      <input 
        type="text" 
        placeholder="123 Rue de Paris, 75000 Paris"
        value={formData.propertyAddress}
        onChange={(e) => updateFormData('propertyAddress', e.target.value)}
      />

      <label>Nom du locataire :</label>
      <input 
        type="text"
        placeholder="Jean Dupont"
        value={formData.tenantName}
        onChange={(e) => updateFormData('tenantName', e.target.value)}
      />

      <label>Mode d'accès (optionnel) :</label>
      <input 
        type="text"
        placeholder="Clé, Digicode, Interphone, etc."
        value={formData.accessMode}
        onChange={(e) => updateFormData('accessMode', e.target.value)}
      />

      <p><strong>Bailleur :</strong> RMV GESTION</p>
    </div>
  );
}

function Step2({ formData, updateFormData }) {
  const roomList = ['Entrée', 'Séjour', 'Salle à manger', 'Chambre 1', 'Chambre 2', 'Cuisine', 'Salle de bain', 'Salle d\'eau', 'Couloir', 'Remise', 'Cave', 'Balcon/Terrasse'];
  const equipmentList = ['Portes', 'Fenêtres', 'Murs', 'Plafonds', 'Sols', 'Chauffage', 'Électricité', 'Plomberie', 'Mobilier', 'Peinture'];

  const conditionStates = [
    { value: 'TB', label: 'Très Bon (TB)' },
    { value: 'B', label: 'Bon (B)' },
    { value: 'M', label: 'Moyen (M)' },
    { value: 'D', label: 'Défaillant (D)' },
    { value: 'NV', label: 'Non visité (NV)' }
  ];

  const toggleRoom = (room) => {
    const rooms = { ...formData.rooms };
    if (rooms[room]) {
      delete rooms[room];
    } else {
      rooms[room] = { equipment: {}, comments: '', photos: [] };
    }
    updateFormData('rooms', rooms);
  };

  const updateEquipment = (room, equipment, state) => {
    const rooms = { ...formData.rooms };
    rooms[room].equipment[equipment] = state;
    updateFormData('rooms', rooms);
  };

  const updateComments = (room, comments) => {
    const rooms = { ...formData.rooms };
    rooms[room].comments = comments;
    updateFormData('rooms', rooms);
  };

  const addPhoto = (room, e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const rooms = { ...formData.rooms };
        if (!rooms[room].photos) rooms[room].photos = [];
        rooms[room].photos.push(event.target.result);
        updateFormData('rooms', rooms);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = (room, photoIndex) => {
    const rooms = { ...formData.rooms };
    rooms[room].photos.splice(photoIndex, 1);
    updateFormData('rooms', rooms);
  };

  return (
    <div className="step">
      <h2>Étape 2 : Pièces et équipements</h2>
      
      <div className="rooms-grid">
        {roomList.map(room => (
          <label key={room} className="room-checkbox">
            <input
              type="checkbox"
              checked={!!formData.rooms[room]}
              onChange={() => toggleRoom(room)}
            />
            {room}
          </label>
        ))}
      </div>

      {Object.keys(formData.rooms).map(room => (
        <div key={room} className="room-section">
          <h3>{room}</h3>
          
          <div className="equipment-grid">
            {equipmentList.map(eq => (
              <div key={eq} className="equipment-item">
                <label>{eq} :</label>
                <select 
                  value={formData.rooms[room].equipment[eq] || 'NV'}
                  onChange={(e) => updateEquipment(room, eq, e.target.value)}
                >
                  {conditionStates.map(state => (
                    <option key={state.value} value={state.value}>
                      {state.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <label>Commentaires :</label>
          <textarea
            value={formData.rooms[room].comments}
            onChange={(e) => updateComments(room, e.target.value)}
            placeholder="Notes sur l'état de la pièce..."
          />

          <label>Photos de la pièce :</label>
          <input 
            type="file" 
            accept="image/*"
            onChange={(e) => addPhoto(room, e)}
          />
          
          {formData.rooms[room].photos && formData.rooms[room].photos.length > 0 && (
            <div className="photos-grid">
              {formData.rooms[room].photos.map((photo, idx) => (
                <div key={idx} className="photo-item">
                  <img src={photo} alt={`Photo ${idx + 1}`} />
                  <button onClick={() => removePhoto(room, idx)}>✕</button>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function Step3({ formData, updateFormData }) {
  const handleMeterChange = (type, value) => {
    updateFormData('meterReadings', { ...formData.meterReadings, [type]: value });
  };

  const addKeysPhoto = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        updateFormData('keysPhoto', event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeKeysPhoto = () => {
    updateFormData('keysPhoto', null);
  };

  return (
    <div className="step">
      <h2>Étape 3 : Index et clés</h2>
      
      <div className="meter-section">
        <div>
          <label>Index Électricité (kWh) :</label>
          <input 
            type="number"
            value={formData.meterReadings.electricity}
            onChange={(e) => handleMeterChange('electricity', e.target.value)}
            placeholder="0"
          />
        </div>

        <div>
          <label>Index Gaz (m³) :</label>
          <input 
            type="number"
            value={formData.meterReadings.gas}
            onChange={(e) => handleMeterChange('gas', e.target.value)}
            placeholder="0"
          />
        </div>

        <div>
          <label>Index Eau (m³) :</label>
          <input 
            type="number"
            value={formData.meterReadings.water}
            onChange={(e) => handleMeterChange('water', e.target.value)}
            placeholder="0"
          />
        </div>
      </div>

      <div className="keys-section">
        <h3>Photo des clés</h3>
        <input 
          type="file" 
          accept="image/*"
          onChange={(e) => addKeysPhoto(e)}
        />
        
        {formData.keysPhoto && (
          <div className="keys-photo">
            <img src={formData.keysPhoto} alt="Clés" />
            <button onClick={removeKeysPhoto}>Supprimer</button>
          </div>
        )}
      </div>
    </div>
  );
}

function Step4({ formData, updateFormData }) {
  const signatureCanvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);

  const startDrawing = (e) => {
    setIsDrawing(true);
    const canvas = signatureCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = signatureCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ctx = canvas.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = signatureCanvasRef.current;
    updateFormData('signature', canvas.toDataURL());
  };

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    updateFormData('signature', null);
  };

  const generatePDF = async () => {
    const doc = new jsPDF();
    let yPos = 10;

    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text('RMV GESTION - État des lieux', 10, yPos);
    yPos += 15;

    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    
    doc.text(`Type d'inspection: ${formData.inspectionType === 'entry' ? 'Entrée' : 'Sortie'}`, 10, yPos);
    yPos += 6;
    doc.text(`Adresse: ${formData.propertyAddress}`, 10, yPos);
    yPos += 6;
    doc.text(`Locataire: ${formData.tenantName}`, 10, yPos);
    yPos += 6;
    if (formData.accessMode) {
      doc.text(`Mode d'accès: ${formData.accessMode}`, 10, yPos);
      yPos += 6;
    }
    doc.text('Bailleur: RMV GESTION', 10, yPos);
    yPos += 12;

    doc.setFont(undefined, 'bold');
    doc.text('Index', 10, yPos);
    yPos += 8;
    doc.setFont(undefined, 'normal');
    doc.text(`Électricité: ${formData.meterReadings.electricity || 'N/A'} kWh`, 15, yPos);
    yPos += 6;
    doc.text(`Gaz: ${formData.meterReadings.gas || 'N/A'} m³`, 15, yPos);
    yPos += 6;
    doc.text(`Eau: ${formData.meterReadings.water || 'N/A'} m³`, 15, yPos);
    yPos += 12;

    doc.setFont(undefined, 'bold');
    doc.text('Pièces et équipements', 10, yPos);
    yPos += 8;
    doc.setFont(undefined, 'normal');

    Object.keys(formData.rooms).forEach(room => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 10;
      }

      doc.setFont(undefined, 'bold');
      doc.text(room, 10, yPos);
      yPos += 6;
      doc.setFont(undefined, 'normal');

      Object.keys(formData.rooms[room].equipment).forEach(eq => {
        const state = formData.rooms[room].equipment[eq];
        doc.text(`${eq}: ${state}`, 15, yPos);
        yPos += 5;
      });

      if (formData.rooms[room].comments) {
        doc.text(`Notes: ${formData.rooms[room].comments}`, 15, yPos);
        yPos += 5;
      }
      yPos += 5;
    });

    if (formData.signature) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }
      doc.setFont(undefined, 'bold');
      doc.text('Signature', 10, yPos);
      yPos += 12;
      doc.addImage(formData.signature, 'PNG', 10, yPos, 50, 20);
    }

    const pdfBlob = doc.output('blob');
    const url = URL.createObjectURL(pdfBlob);
    setPdfUrl(url);
  };

  return (
    <div className="step">
      <h2>Étape 4 : Signature et PDF</h2>
      
      <div className="signature-section">
        <h3>Signature électronique</h3>
        <p>Tracez votre signature ci-dessous</p>
        <canvas
          ref={signatureCanvasRef}
          width={400}
          height={150}
          className="signature-canvas"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
        <div className="signature-buttons">
          <button onClick={clearSignature}>Effacer la signature</button>
          <button onClick={generatePDF} className="btn-primary">Générer le PDF</button>
        </div>
      </div>

      {pdfUrl && (
        <div className="pdf-preview">
          <h3>Aperçu du PDF</h3>
          <iframe src={pdfUrl} style={{ width: '100%', height: '600px', marginTop: '15px', border: '1px solid #ddd', borderRadius: '8px' }} />
          <div style={{ marginTop: '20px' }}>
            <a href={pdfUrl} download="etat-des-lieux.pdf">
              <button className="btn-primary">📥 Télécharger le PDF</button>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
