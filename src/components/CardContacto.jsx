import { useState, useEffect, useRef } from 'react';
import emailjs from '@emailjs/browser';
import contactConfig from '../config/contact.json';
import './CardQueEsArlequin.css';
import './CardContacto.css';

const CARD_FRAMES_CLEAR = [
  '00000_arlequin_dorso_clear.avif',
  '00001_arlequin_dorso_clear.avif',
  '00002_arlequin_dorso_clear.avif',
  '00003_arlequin_dorso_clear.avif',
  '00004_arlequin_dorso_clear.avif',
  '00005_arlequin_dorso_clear.avif',
  '00006_arlequin_dorso_clear.avif',
  '00007_arlequin_contacto_clear.avif',
  '00008_arlequin_contacto_clear.avif',
  '00009_arlequin_contacto_clear.avif',
  '00010_arlequin_contacto_clear.avif',
  '00011_arlequin_contacto_clear.avif',
  '00012_arlequin_contacto_clear.avif',
];

const CARD_FRAMES_BLACK = [
  '00000_arlequin_dorso_dark.avif',
  '00001_arlequin_dorso_dark.avif',
  '00002_arlequin_dorso_dark.avif',
  '00003_arlequin_dorso_dark.avif',
  '00004_arlequin_dorso_dark.avif',
  '00005_arlequin_dorso_dark.avif',
  '00006_arlequin_dorso_dark.avif',
  '00007_arlequin_contacto_black.avif',
  '00008_arlequin_contacto_black.avif',
  '00009_arlequin_contacto_black.avif',
  '00010_arlequin_contacto_black.avif',
  '00011_arlequin_contacto_black.avif',
  '00012_arlequin_contacto_black.avif',
];

const CARD_FINAL_FRAME_CLEAR = 'arlequin_contacto_clear_boton.avif';
const CARD_FINAL_FRAME_BLACK  = 'arlequin_contacto_dark_boton.avif';

const CLOSE_FRAMES_CLEAR = [
  '00013_arlequin_contacto_clear.avif',
  '00014_arlequin_contacto_clear.avif',
  '00015_arlequin_contacto_clear.avif',
  '00016_arlequin_contacto_clear.avif',
  '00017_arlequin_contacto_clear.avif',
  '00018_arlequin_contacto_clear.avif',
  '00019_arlequin_dorso_clear.avif',
  '00020_arlequin_dorso_clear.avif',
  '00021_arlequin_dorso_clear.avif',
  '00022_arlequin_dorso_clear.avif',
  '00023_arlequin_dorso_clear.avif',
];

const CLOSE_FRAMES_BLACK = [
  '00013_arlequin_contacto_black.avif',
  '00014_arlequin_contacto_black.avif',
  '00015_arlequin_contacto_black.avif',
  '00016_arlequin_contacto_black.avif',
  '00017_arlequin_contacto_black.avif',
  '00018_arlequin_contacto_black.avif',
  '00019_arlequin_dorso_dark.avif',
  '00020_arlequin_dorso_dark.avif',
  '00021_arlequin_dorso_dark.avif',
  '00022_arlequin_dorso_dark.avif',
  '00023_arlequin_dorso_dark.avif',
];

const CARD_FRAME_DURATION = 40;
const CARD_WIDTH  = 550;
const CARD_HEIGHT = 680;

const _openCache  = {};
const _closeCache = {};

function CardContacto({ isDarkMode, onClose, fromGrid = false }) {
  const canvasRef             = useRef(null);
  const imagesRef             = useRef([]);
  const closeImagesRef        = useRef([]);
  const animationRef          = useRef(null);
  const currentFrameRef       = useRef(0);
  const lastFrameTimeRef      = useRef(0);
  const isCompleteRef         = useRef(false);
  const closeFrameRef         = useRef(0);
  const lastCloseFrameTimeRef = useRef(0);
  const isLoadedRef           = useRef(false);

  const [isLoaded,          setIsLoaded]          = useState(false);
  const [canStartAnimation, setCanStartAnimation] = useState(false);
  const [showContent,       setShowContent]       = useState(false);
  const [isClosing,         setIsClosing]         = useState(false);
  const [nombre,            setNombre]            = useState('');
  const [mail,              setMail]              = useState('');
  const [telefono,          setTelefono]          = useState('');
  const [descripcion,       setDescripcion]       = useState('');
  const [isScalingDown,     setIsScalingDown]     = useState(false);
  const [enviando,          setEnviando]          = useState(false);
  const [enviado,           setEnviado]           = useState(false);
  const [errorEnvio,        setErrorEnvio]        = useState(false);

  const cardFrames     = isDarkMode ? CARD_FRAMES_BLACK   : CARD_FRAMES_CLEAR;
  const closeFrames    = isDarkMode ? CLOSE_FRAMES_BLACK  : CLOSE_FRAMES_CLEAR;
  const cardFinalFrame = isDarkMode ? CARD_FINAL_FRAME_BLACK : CARD_FINAL_FRAME_CLEAR;
  const totalFrames    = cardFrames.length;

  const handleClose = () => {
    if (isClosing) return;
    setShowContent(false);
    setIsClosing(true);
  };

  const countWords = (text) =>
    text.trim() === '' ? 0 : text.trim().split(/\s+/).length;

  const handleDescripcion = (e) => {
    const val = e.target.value;
    if (countWords(val) <= 30 || val.length < descripcion.length) {
      setDescripcion(val);
    }
  };

  const handleEnviar = async () => {
    if (enviando || enviado) return;
    setEnviando(true);
    setErrorEnvio(false);

    const { serviceId, templateId, publicKey } = contactConfig.emailjs;

    try {
      await emailjs.send(
        serviceId,
        templateId,
        {
          to_email:   contactConfig.destinatario,
          from_name:  nombre,
          from_email: mail,
          telefono,
          descripcion,
        },
        publicKey
      );
      setEnviado(true);
      setNombre('');
      setMail('');
      setTelefono('');
      setDescripcion('');
    } catch (err) {
      console.error('Error al enviar:', err);
      setErrorEnvio(true);
    } finally {
      setEnviando(false);
    }
  };

  // Start open animation
  useEffect(() => {
    if (!isLoaded) return;
    if (fromGrid) {
      setCanStartAnimation(true);
    } else {
      const t = setTimeout(() => setCanStartAnimation(true), 600);
      return () => clearTimeout(t);
    }
  }, [isLoaded, fromGrid]);

  // Preload frames — first load starts animation, theme change swaps buffers silently
  useEffect(() => {
    const wasLoaded = isLoadedRef.current;

    const loadImages = async () => {
      const themeKey = isDarkMode ? 'dark' : 'clear';

      if (_openCache[themeKey]) {
        imagesRef.current = _openCache[themeKey];
        closeImagesRef.current = _closeCache[themeKey];
        if (!wasLoaded) {
          isLoadedRef.current = true;
          setIsLoaded(true);
        } else if (isCompleteRef.current) {
          const canvas = canvasRef.current;
          const ctx    = canvas.getContext('2d');
          const finalFrame = _openCache[themeKey][_openCache[themeKey].length - 1];
          if (finalFrame) {
            ctx.clearRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
            ctx.drawImage(finalFrame, 0, 0, CARD_WIDTH, CARD_HEIGHT);
          }
        }
        return;
      }

      const openPromises = [...cardFrames, cardFinalFrame].map(file =>
        new Promise(resolve => {
          const img = new Image();
          img.onload  = () => img.decode().then(() => resolve(img)).catch(() => resolve(img));
          img.onerror = () => resolve(null);
          img.src = `/Cartas/${file}`;
        })
      );
      const closePromises = closeFrames.map(file =>
        new Promise(resolve => {
          const img = new Image();
          img.onload  = () => img.decode().then(() => resolve(img)).catch(() => resolve(img));
          img.onerror = () => resolve(null);
          img.src = `/Cartas/${file}`;
        })
      );
      const [openResults, closeResults] = await Promise.all([
        Promise.all(openPromises),
        Promise.all(closePromises),
      ]);

      _openCache[themeKey]   = openResults;
      _closeCache[themeKey]  = closeResults;
      imagesRef.current      = openResults;
      closeImagesRef.current = closeResults;

      if (!wasLoaded) {
        isLoadedRef.current = true;
        setIsLoaded(true);
      } else if (isCompleteRef.current) {
        const canvas = canvasRef.current;
        const ctx    = canvas.getContext('2d');
        const finalFrame = openResults[openResults.length - 1];
        if (finalFrame) {
          ctx.clearRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
          ctx.drawImage(finalFrame, 0, 0, CARD_WIDTH, CARD_HEIGHT);
        }
      }
    };
    loadImages();
  }, [isDarkMode]);

  // Draw first frame when loaded
  useEffect(() => {
    if (!isLoaded) return;
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(CARD_WIDTH * dpr);
    canvas.height = Math.round(CARD_HEIGHT * dpr);
    canvas.style.width = `${CARD_WIDTH}px`;
    canvas.style.height = `${CARD_HEIGHT}px`;
    ctx.scale(dpr, dpr);
    const first = imagesRef.current[0];
    if (first) { ctx.clearRect(0, 0, CARD_WIDTH, CARD_HEIGHT); ctx.drawImage(first, 0, 0, CARD_WIDTH, CARD_HEIGHT); }
  }, [isLoaded]);

  // Open animation loop
  useEffect(() => {
    if (!isLoaded || !canStartAnimation || isClosing) return;

    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(CARD_WIDTH * dpr);
    canvas.height = Math.round(CARD_HEIGHT * dpr);
    canvas.style.width = `${CARD_WIDTH}px`;
    canvas.style.height = `${CARD_HEIGHT}px`;
    ctx.scale(dpr, dpr);

    const drawFrame = () => {
      if (isCompleteRef.current) {
        const final = imagesRef.current[totalFrames];
        if (final) { ctx.clearRect(0, 0, CARD_WIDTH, CARD_HEIGHT); ctx.drawImage(final, 0, 0, CARD_WIDTH, CARD_HEIGHT); }
        setShowContent(true);
        return;
      }
      const frame = imagesRef.current[currentFrameRef.current];
      if (frame) { ctx.clearRect(0, 0, CARD_WIDTH, CARD_HEIGHT); ctx.drawImage(frame, 0, 0, CARD_WIDTH, CARD_HEIGHT); }
    };

    drawFrame();

    const animate = (timestamp) => {
      if (timestamp - lastFrameTimeRef.current >= CARD_FRAME_DURATION) {
        if (currentFrameRef.current < totalFrames - 1) {
          currentFrameRef.current++;
        } else {
          isCompleteRef.current = true;
        }
        lastFrameTimeRef.current += CARD_FRAME_DURATION;
        drawFrame();
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, [isLoaded, canStartAnimation, totalFrames, isClosing]);

  // Close animation loop
  useEffect(() => {
    if (!isClosing || !isLoaded) return;
    if (animationRef.current) cancelAnimationFrame(animationRef.current);

    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    closeFrameRef.current         = 0;
    lastCloseFrameTimeRef.current = 0;
    const frames = closeImagesRef.current;

    const animate = (timestamp) => {
      if (timestamp - lastCloseFrameTimeRef.current >= CARD_FRAME_DURATION) {
        const frame = frames[closeFrameRef.current];
        if (frame) { ctx.clearRect(0, 0, CARD_WIDTH, CARD_HEIGHT); ctx.drawImage(frame, 0, 0, CARD_WIDTH, CARD_HEIGHT); }
        lastCloseFrameTimeRef.current += CARD_FRAME_DURATION;
        if (closeFrameRef.current < frames.length - 1) {
          closeFrameRef.current++;
          animationRef.current = requestAnimationFrame(animate);
        } else {
          const frame0 = imagesRef.current[0];
          if (frame0) { ctx.clearRect(0, 0, CARD_WIDTH, CARD_HEIGHT); ctx.drawImage(frame0, 0, 0, CARD_WIDTH, CARD_HEIGHT); }
          setIsScalingDown(true);
          setTimeout(() => onClose(), 400);
        }
      } else {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, [isClosing, isLoaded]);

  if (!isLoaded) return <div className="card-que-es-arlequin loading" />;

  return (
    <div className="card-que-es-arlequin card-contacto-outer">
      <button className="card-close-btn" onClick={handleClose} title="Cerrar">
        <img
          src={`/Cartas/arlequin_elemento_web_X_${isDarkMode ? 'dark' : 'clare'}.avif`}
          alt="Cerrar"
          className="card-close-btn-img"
        />
      </button>

      <canvas
        ref={canvasRef}
        className={`card-canvas${isScalingDown ? ' card-canvas--exiting' : ''}`}
        style={!isScalingDown && fromGrid ? { animation: 'none' } : undefined}
      />

      {showContent && (
        <>
          <div className="contacto-form">
<div className="contacto-field-group">
              <input
                type="text"
                className="contacto-field"
                placeholder="Nombre"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
              />
            </div>
            <div className="contacto-field-group">
              <input
                type="email"
                className="contacto-field"
                placeholder="Mail"
                value={mail}
                onChange={e => setMail(e.target.value)}
              />
            </div>
            <div className="contacto-field-group">
              <input
                type="tel"
                className="contacto-field"
                placeholder="Teléfono"
                value={telefono}
                onChange={e => setTelefono(e.target.value)}
              />
            </div>
            <div className="contacto-field-group">
              <textarea
                className="contacto-field contacto-textarea"
                placeholder="Descripción"
                value={descripcion}
                onChange={handleDescripcion}
              />
              <div className={`contacto-word-count${countWords(descripcion) >= 30 ? ' over' : ''}`}>
                {countWords(descripcion)}/30
              </div>
            </div>
          </div>

          <div className="contacto-send-area">
            {enviado && <span className="contacto-status contacto-status--ok">¡Enviado!</span>}
            {errorEnvio && <span className="contacto-status contacto-status--error">Error al enviar</span>}
            <button
              className="contacto-send-btn"
              onClick={handleEnviar}
              title="Enviar"
              disabled={enviando || enviado}
            >
              {enviando ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="31.4" strokeLinecap="round">
                    <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite"/>
                  </circle>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default CardContacto;
