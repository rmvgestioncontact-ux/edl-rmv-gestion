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
        <h1>État des Lieux - RMV GESTION</h1>
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
      <h2>Étape 1 : Informations du bien</h2>
      
      <label>Type d'inspection:</label>
      <select value={formData.inspectionType} onChange={(e) => updateFormData('inspectionType', e.target.value)}>
        <option value="entry">Entrée</option>
        <option value="exit">Sortie</option>
      </select>

      <label>Adresse du bien:</label>
      <input 
        type="text" 
        placeholder="123 Rue de Paris, 75000 Paris"
        value={formData.propertyAddress}
        onChange={(e) => updateFormData('propertyAddress', e.target.value)}
      />

      <label>Nom du locataire:</label>
      <input 
        type="text"
        placeholder="Jean Dupont"
        value={formData.tenantName}
        onChange={(e) => updateFormData('tenantName', e.target.value)}
      />

      <label>Mode d'accès:</label>
      <input 
        type="text"
        placeholder="Clé, Digicode, etc."
        value={formData.accessMode}
        onChange={(e) => updateFormData('accessMode', e.target.value)}
      />

      <p><strong>Bailleur:</strong> RMV GESTION</p>
    </div>
  );
}

function Step2({ formData, updateFormData }) {
  const roomList = ['Entrée', 'Séjour', 'Cuisine', 'Chambre', 'Salle de bain', 'Couloir', 'Remise'];
  const equipmentList = ['Portes', 'Fenêtres', 'Murs', 'Plafonds', 'Sols', 'Chauffage', 'Électricité'];

  const toggleRoom = (room) => {
    const rooms = { ...formData.rooms };
    if (rooms[room]) {
      delete rooms[room];
    } else {
      rooms[room] = { equipment: {}, comments: '' };
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
                <label>{eq}:</label>
                <select 
                  value={formData.rooms[room].equipment[eq] || 'NV'}
                  onChange={(e) => updateEquipment(room, eq, e.target.value)}
                >
                  <option value="TB">TB</option>
                  <option value="B">B</option>
                  <option value="M">M</option>
                  <option value="D">D</option>
                  <option value="NV">NV</option>
                </select>
              </div>
            ))}
          </div>

          <label>Commentaires:</label>
          <textarea
            value={formData.rooms[room].comments}
            onChange={(e) => updateComments(room, e.target.value)}
            placeholder="Notes..."
          />
        </div>
      ))}
    </div>
  );
}

function Step3({ formData, updateFormData }) {
  const handleMeterChange = (type, value) => {
    updateFormData('meterReadings', { ...formData.meterReadings, [type]: value });
  };

  return (
    <div className="step">
      <h2>Étape 3 : Index</h2>
      
      <div className="meter-section">
        <div>
          <label>Électricité (kWh):</label>
          <input 
            type="number"
            value={formData.meterReadings.electricity}
            onChange={(e) => handleMeterChange('electricity', e.target.value)}
          />
        </div>

        <div>
          <label>Gaz (m³):</label>
          <input 
            type="number"
            value={formData.meterReadings.gas}
            onChange={(e) => handleMeterChange('gas', e.target.value)}
          />
        </div>

        <div>
          <label>Eau (m³):</label>
          <input 
            type="number"
            value={formData.meterReadings.water}
            onChange={(e) => handleMeterChange('water', e.target.value)}
          />
        </div>
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

  const generatePDF = () => {
    const doc = new jsPDF();
    let yPos = 20;

    doc.setFontSize(16);
    doc.text('RMV GESTION', 105, yPos, { align: 'center' });
    yPos += 15;

    doc.setFontSize(11);
    doc.text(`Type: ${formData.inspectionType === 'entry' ? 'Entrée' : 'Sortie'}`, 20, yPos);
    yPos += 8;
    doc.text(`Adresse: ${formData.propertyAddress}`, 20, yPos);
    yPos += 8;
    doc.text(`Locataire: ${formData.tenantName}`, 20, yPos);
    yPos += 15;

    doc.text('Index:', 20, yPos);
    yPos += 8;
    doc.text(`Électricité: ${formData.meterReadings.electricity}`, 25, yPos);
    yPos += 6;
    doc.text(`Gaz: ${formData.meterReadings.gas}`, 25, yPos);
    yPos += 6;
    doc.text(`Eau: ${formData.meterReadings.water}`, 25, yPos);
    yPos += 15;

    Object.keys(formData.rooms).forEach(room => {
      doc.text(room, 20, yPos);
      yPos += 6;
      Object.keys(formData.rooms[room].equipment).forEach(eq => {
        const state = formData.rooms[room].equipment[eq];
        doc.text(`${eq}: ${state}`, 25, yPos);
        yPos += 5;
      });
    });

    if (formData.signature) {
      doc.addImage(formData.signature, 'PNG', 20, yPos + 10, 50, 20);
    }

    const pdfBlob = doc.output('blob');
    const url = URL.createObjectURL(pdfBlob);
    setPdfUrl(url);
  };

  return (
    <div className="step">
      <h2>Étape 4 : Signature</h2>
      
      <div className="signature-section">
        <h3>Signer ici:</h3>
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
        <button onClick={clearSignature}>Effacer</button>
        <button onClick={generatePDF} style={{marginLeft: '10px'}}>Générer PDF</button>
      </div>

      {pdfUrl && (
        <div className="pdf-preview">
          <a href={pdfUrl} download="etat-des-lieux.pdf">
            <button>Télécharger PDF</button>
          </a>
        </div>
      )}
    </div>
  );
}
