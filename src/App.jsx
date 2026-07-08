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
        <img src="/Screenshot 2026-07-04 225530_edited.png" className="header-image" />
      </header>
      
      <nav className="step-nav">
        {[1, 2, 3, 4].map(step => (
          <button key={step} className={`step-btn ${currentStep === step ? 'active' : ''}`} onClick={() => setCurrentStep(step)}>
            Étape {step}
          </button>
        ))}
      </nav>

      <main className="step-container">
        {currentStep === 1 && <Step1 formData={formData} updateFormData={updateFormData} />}
        {currentStep === 2 && <Step2 formData={formData} updateFormData={updateFormData} />}
        {currentStep === 3 && <Step3 formData={formData} updateFormData={updateFormData} />}
        {currentStep === 4 && <Step4 formData={formData} />}
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
      <input type="text" placeholder="123 Rue de Paris, 75000 Paris" value={formData.propertyAddress} onChange={(e) => updateFormData('propertyAddress', e.target.value)} />

      <label>Nom du locataire :</label>
      <input type="text" placeholder="Jean Dupont" value={formData.tenantName} onChange={(e) => updateFormData('tenantName', e.target.value)} />

      <label>Mode d'accès (optionnel) :</label>
      <input type="text" placeholder="Clé, Digicode, etc." value={formData.accessMode} onChange={(e) => updateFormData('accessMode', e.target.value)} />

      <p><strong>Bailleur :</strong> RMV GESTION</p>
    </div>
  );
}

function Step2({ formData, updateFormData }) {
  const conditions = ['TB', 'B', 'M', 'D', 'NV'];

  const addRoom = () => {
    const roomName = prompt('Nom de la pièce :');
    if (roomName && roomName.trim()) {
      const rooms = { ...formData.rooms };
      rooms[roomName] = { equipment: {}, photos: [] };
      updateFormData('rooms', rooms);
    }
  };

  const removeRoom = (room) => {
    if (window.confirm(`Supprimer la pièce "${room}" ?`)) {
      const rooms = { ...formData.rooms };
      delete rooms[room];
      updateFormData('rooms', rooms);
    }
  };

  const addEquipment = (room) => {
    const equipmentName = prompt('Nom de l\'équipement :');
    if (equipmentName && equipmentName.trim()) {
      const rooms = { ...formData.rooms };
      rooms[room].equipment[equipmentName] = { state: 'NV', comment: '', photo: null };
      updateFormData('rooms', rooms);
    }
  };

  const removeEquipment = (room, equipment) => {
    const rooms = { ...formData.rooms };
    delete rooms[room].equipment[equipment];
    updateFormData('rooms', rooms);
  };

  const updateEquipmentState = (room, equipment, state) => {
    const rooms = { ...formData.rooms };
    rooms[room].equipment[equipment].state = state;
    updateFormData('rooms', rooms);
  };

  const updateEquipmentComment = (room, equipment, comment) => {
    const rooms = { ...formData.rooms };
    rooms[room].equipment[equipment].comment = comment;
    updateFormData('rooms', rooms);
  };

  const addEquipmentPhoto = (room, equipment, e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const rooms = { ...formData.rooms };
        rooms[room].equipment[equipment].photo = event.target.result;
        updateFormData('rooms', rooms);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeEquipmentPhoto = (room, equipment) => {
    const rooms = { ...formData.rooms };
    rooms[room].equipment[equipment].photo = null;
    updateFormData('rooms', rooms);
  };

  return (
    <div className="step">
      <h2>Étape 2 : Pièces et équipements</h2>
      
      <button onClick={addRoom} className="btn-add">+ Ajouter une pièce</button>

      {Object.keys(formData.rooms).map(room => (
        <div key={room} className="room-section">
          <div className="room-header">
            <h3>{room}</h3>
            <button onClick={() => removeRoom(room)} className="btn-delete">✕ Supprimer pièce</button>
          </div>
          
          <div className="equipment-list">
            {Object.keys(formData.rooms[room].equipment).map(equipment => (
              <div key={equipment} className="equipment-card">
                <div className="equipment-header">
                  <h4>{equipment}</h4>
                  <button onClick={() => removeEquipment(room, equipment)} className="btn-delete-eq">✕</button>
                </div>

                <label>État :</label>
                <select value={formData.rooms[room].equipment[equipment].state || 'NV'} onChange={(e) => updateEquipmentState(room, equipment, e.target.value)}>
                  {conditions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                <label>Commentaire :</label>
                <textarea value={formData.rooms[room].equipment[equipment].comment || ''} onChange={(e) => updateEquipmentComment(room, equipment, e.target.value)} placeholder="Notes sur cet équipement..." />

                <label>Photo :</label>
                <input type="file" accept="image/*" onChange={(e) => addEquipmentPhoto(room, equipment, e)} />
                
                {formData.rooms[room].equipment[equipment].photo && (
                  <div className="equipment-photo">
                    <img src={formData.rooms[room].equipment[equipment].photo} alt={equipment} />
                    <button onClick={() => removeEquipmentPhoto(room, equipment)}>Supprimer photo</button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <button onClick={() => addEquipment(room)} className="btn-add-equipment">+ Ajouter équipement</button>
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
          <label>Électricité (kWh) :</label>
          <input type="number" value={formData.meterReadings.electricity} onChange={(e) => handleMeterChange('electricity', e.target.value)} />
        </div>
        <div>
          <label>Gaz (m³) :</label>
          <input type="number" value={formData.meterReadings.gas} onChange={(e) => handleMeterChange('gas', e.target.value)} />
        </div>
        <div>
          <label>Eau (m³) :</label>
          <input type="number" value={formData.meterReadings.water} onChange={(e) => handleMeterChange('water', e.target.value)} />
        </div>
      </div>

      <div className="keys-section">
        <h3>Photo des clés</h3>
        <input type="file" accept="image/*" onChange={addKeysPhoto} />
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
function Step4({ formData }) {
  const signatureCanvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);

  const startDrawing = (e) => {
    setIsDrawing(true);
    const canvas = signatureCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = signatureCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
  };

  const generatePDF = async () => {
    const doc = new jsPDF();
    let yPos = 10;
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    const margin = 10;
    const contentWidth = pageWidth - (2 * margin);

    try {
      const headerResponse = await fetch('/Screenshot 2026-07-04 225530_edited.png');
      const headerBlob = await headerResponse.blob();
      const headerReader = new FileReader();

      headerReader.onload = () => {
        // En-tête
        doc.addImage(headerReader.result, 'PNG', margin, yPos, contentWidth, 25);
        yPos += 30;

        // Titre
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('ÉTAT DES LIEUX', pageWidth / 2, yPos, { align: 'center' });
        yPos += 10;

        // Infos du bien
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text('INFORMATIONS GÉNÉRALES', margin, yPos);
        yPos += 8;

        doc.setFont(undefined, 'normal');
        doc.setFontSize(10);
        doc.text(`Type : ${formData.inspectionType === 'entry' ? 'ENTRÉE' : 'SORTIE'}`, margin, yPos);
        yPos += 6;
        doc.text(`Adresse : ${formData.propertyAddress}`, margin, yPos);
        yPos += 6;
        doc.text(`Locataire : ${formData.tenantName}`, margin, yPos);
        yPos += 6;
        doc.text(`Bailleur : RMV GESTION`, margin, yPos);
        yPos += 10;

        // Index
        doc.setFont(undefined, 'bold');
        doc.setFontSize(11);
        doc.text('INDEX', margin, yPos);
        yPos += 8;

        doc.setFont(undefined, 'normal');
        doc.setFontSize(10);
        doc.text(`Électricité : ${formData.meterReadings.electricity || 'N/A'} kWh`, margin + 5, yPos);
        yPos += 5;
        doc.text(`Gaz : ${formData.meterReadings.gas || 'N/A'} m³`, margin + 5, yPos);
        yPos += 5;
        doc.text(`Eau : ${formData.meterReadings.water || 'N/A'} m³`, margin + 5, yPos);
        yPos += 12;

        // Pièces et équipements
        doc.setFont(undefined, 'bold');
        doc.setFontSize(11);
        doc.text('PIÈCES ET ÉQUIPEMENTS', margin, yPos);
        yPos += 10;

        Object.keys(formData.rooms).forEach(room => {
          if (yPos > pageHeight - 40) {
            doc.addPage();
            yPos = margin;
          }

          // Titre de la pièce
          doc.setFont(undefined, 'bold');
          doc.setFontSize(11);
          doc.setFillColor(230, 230, 250);
          doc.rect(margin, yPos - 4, contentWidth, 6, 'F');
          doc.text(room.toUpperCase(), margin + 2, yPos);
          yPos += 8;

          // Équipements
          doc.setFont(undefined, 'normal');
          doc.setFontSize(9);

          Object.keys(formData.rooms[room].equipment).forEach(equipment => {
            if (yPos > pageHeight - 50) {
              doc.addPage();
              yPos = margin;
            }

            const eq = formData.rooms[room].equipment[equipment];
            const state = eq.state || 'NV';

            doc.text(`• ${equipment} : ${state}`, margin + 3, yPos);
            yPos += 4;

            if (eq.comment) {
              doc.setFont(undefined, 'italic');
              doc.setFontSize(8);
              const lines = doc.splitTextToSize(`Notes: ${eq.comment}`, contentWidth - 10);
              lines.forEach(line => {
                if (yPos > pageHeight - 40) {
                  doc.addPage();
                  yPos = margin;
                }
                doc.text(line, margin + 5, yPos);
                yPos += 3;
              });
              doc.setFont(undefined, 'normal');
              doc.setFontSize(9);
              yPos += 1;
            }

            if (eq.photo) {
              if (yPos > pageHeight - 50) {
                doc.addPage();
                yPos = margin;
              }
              doc.addImage(eq.photo, 'PNG', margin + 10, yPos, 30, 25);
              yPos += 28;
            }

            yPos += 2;
          });

          yPos += 4;
        });

        // Signature
        const signatureCanvas = signatureCanvasRef.current;
        if (signatureCanvas) {
          const signatureData = signatureCanvas.toDataURL();
          const isSignatureEmpty = signatureData === 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
          
          if (!isSignatureEmpty) {
            if (yPos > pageHeight - 50) {
              doc.addPage();
              yPos = margin;
            }

            doc.setFont(undefined, 'bold');
            doc.setFontSize(11);
            doc.text('SIGNATURE', margin, yPos);
            yPos += 8;
            doc.addImage(signatureData, 'PNG', margin, yPos, 60, 25);
          }
        }

        const pdfBlob = doc.output('blob');
        const url = URL.createObjectURL(pdfBlob);
        setPdfUrl(url);
      };

      headerReader.readAsDataURL(headerBlob);
    } catch (error) {
      alert('Erreur lors de la génération du PDF');
      console.error(error);
    }
  };

  return (
    <div className="step">
      <h2>Étape 4 : Signature et PDF</h2>
      
      <div className="signature-section">
        <h3>Signature électronique</h3>
        <canvas ref={signatureCanvasRef} width={400} height={150} className="signature-canvas" onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} />
        <div className="signature-buttons">
          <button onClick={clearSignature}>Effacer</button>
          <button onClick={generatePDF} className="btn-primary">Générer PDF</button>
        </div>
      </div>

      {pdfUrl && (
        <div className="pdf-preview">
          <h3>Aperçu du PDF</h3>
          <iframe title="PDF Preview" src={pdfUrl} style={{ width: '100%', height: '600px', marginTop: '15px' }} />
          <a href={pdfUrl} download="etat-des-lieux.pdf" style={{ marginTop: '20px', display: 'block' }}>
            <button className="btn-primary">📥 Télécharger le PDF</button>
          </a>
        </div>
      )}
    </div>
  );
}
