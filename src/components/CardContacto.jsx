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

// Button animation constants
const BTN_LOOP_END        = 71;   // frames 0-71: loop idle
const BTN_SEND_START      = 72;   // frames 72-168: send one-shot
const BTN_SEND_END        = 168;
const BTN_FRAME_DURATION  = 40;
const BTN_DISPLAY_WIDTH   = 500;  // px — tamaño visual del botón animado

const _openCache  = {};
const _closeCache = {};
const _btnCache   = {};

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

  // Button animation refs
  const btnCanvasRef     = useRef(null);
  const btnLoopFramesRef = useRef([]);
  const btnSendFramesRef = useRef([]);
  const btnAnimRef       = useRef(null);
  const btnFrameRef      = useRef(0);
  const btnPhaseRef      = useRef('loop'); // 'loop' | 'send' | 'done'
  const btnLastTimeRef   = useRef(0);

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
  const [isBtnLoaded,       setIsBtnLoaded]       = useState(false);
  const [btnPhaseDone,      setBtnPhaseDone]      = useState(false);

  const cardFrames     = isDarkMode ? CARD_FRAMES_BLACK    : CARD_FRAMES_CLEAR;
  const closeFrames    = isDarkMode ? CLOSE_FRAMES_BLACK   : CLOSE_FRAMES_CLEAR;
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

  const mailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail.trim());

  // Teléfono Argentina: acepta formatos con/sin +54, con/sin 0, con/sin 9 móvil.
  // Extrae solo dígitos y valida 8–13 dígitos (cubre local, sin cód país, con cód país).
  const telValido = /^\+?[\d\s\-().]{8,20}$/.test(telefono.trim()) &&
    telefono.replace(/\D/g, '').length >= 8;

  const formValido = nombre.trim() !== '' && mailValido && telValido && descripcion.trim() !== '';

  const handleBtnClick = () => {
    if (btnPhaseRef.current !== 'loop' || enviando || enviado || !formValido) return;
    btnPhaseRef.current    = 'send';
    btnFrameRef.current    = 0;
    btnLastTimeRef.current = 0;
    handleEnviar();
  };

  // Refs para window listeners — siempre tienen los valores actuales sin stale closure
  const winClickRef = useRef(null);
  const winMoveRef  = useRef(null);
  const moveRafRef  = useRef(null);

  winClickRef.current = (e) => {
    if (!showContent || btnPhaseDone || !isBtnLoaded || !formValido || enviando || enviado) return;
    const canvas = btnCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (x < 0 || y < 0 || x > rect.width || y > rect.height) return;
    const scale = canvas.width / rect.width;
    const px = Math.round(x * scale);
    const py = Math.round(y * scale);
    if (canvas.getContext('2d').getImageData(px, py, 1, 1).data[3] < 10) return;
    handleBtnClick();
  };

  winMoveRef.current = (e) => {
    if (moveRafRef.current) return;
    moveRafRef.current = requestAnimationFrame(() => {
      moveRafRef.current = null;
      const canvas = btnCanvasRef.current;
      if (!canvas || !showContent || btnPhaseDone || !isBtnLoaded) {
        document.body.style.cursor = '';
        return;
      }
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      let isOver = false;
      if (formValido && !enviando && !enviado && x >= 0 && y >= 0 && x <= rect.width && y <= rect.height) {
        const scale = canvas.width / rect.width;
        isOver = canvas.getContext('2d').getImageData(
          Math.round(x * scale), Math.round(y * scale), 1, 1
        ).data[3] > 10;
      }
      document.body.style.cursor = isOver ? 'pointer' : '';
    });
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

  // Preload card frames
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

  // Preload button frames
  useEffect(() => {
    const theme = isDarkMode ? 'dark' : 'clear';
    let cancelled = false;

    setIsBtnLoaded(false);
    setBtnPhaseDone(false);
    btnPhaseRef.current = 'loop';
    btnFrameRef.current = 0;

    if (_btnCache[theme]) {
      btnLoopFramesRef.current = _btnCache[theme].loop;
      btnSendFramesRef.current = _btnCache[theme].send;
      setIsBtnLoaded(true);
      return () => { cancelled = true; };
    }

    const folder = `/NEW_animacion_boton_enviar_${theme}/NEW_animacion_boton_enviar_${theme}/`;

    const loopPromises = Array.from({ length: BTN_LOOP_END + 1 }, (_, i) =>
      new Promise(resolve => {
        const img = new Image();
        img.onload  = () => img.decode().then(() => resolve(img)).catch(() => resolve(img));
        img.onerror = () => resolve(null);
        img.src = `${folder}animacion_boton_enviar_${String(i).padStart(5, '0')}_loop.avif`;
      })
    );

    const sendPromises = Array.from({ length: BTN_SEND_END - BTN_SEND_START + 1 }, (_, i) => {
      const n = BTN_SEND_START + i;
      return new Promise(resolve => {
        const img = new Image();
        img.onload  = () => img.decode().then(() => resolve(img)).catch(() => resolve(img));
        img.onerror = () => resolve(null);
        img.src = `${folder}animacion_boton_enviar_${theme}_${String(n).padStart(5, '0')}.avif`;
      });
    });

    Promise.all([Promise.all(loopPromises), Promise.all(sendPromises)]).then(([loop, send]) => {
      if (cancelled) return; // tema cambió mientras cargaba — descartar
      _btnCache[theme] = { loop, send };
      btnLoopFramesRef.current = loop;
      btnSendFramesRef.current = send;
      setIsBtnLoaded(true);
    });

    return () => { cancelled = true; };
  }, [isDarkMode]);

  // Draw first card frame when loaded
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
    if (btnAnimRef.current) cancelAnimationFrame(btnAnimRef.current);

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

  // Button animation RAF loop
  useEffect(() => {
    if (!showContent || !isBtnLoaded) return;
    const canvas = btnCanvasRef.current;
    if (!canvas) return;
    const firstFrame = btnLoopFramesRef.current[0];
    if (!firstFrame) return;

    const dpr = window.devicePixelRatio || 1;
    const w = firstFrame.naturalWidth;
    const h = firstFrame.naturalHeight;
    const displayH = Math.round(h * BTN_DISPLAY_WIDTH / w);
    canvas.width  = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width  = `${BTN_DISPLAY_WIDTH}px`;
    canvas.style.height = `${displayH}px`;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    btnPhaseRef.current = 'loop';
    btnFrameRef.current = 0;
    setBtnPhaseDone(false);

    // Dibuja frame 0 inmediatamente — sin esperar el primer tick del RAF
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(firstFrame, 0, 0, w, h);

    const animate = (timestamp) => {
      // Inicializa lastTime en el primer tick real para evitar burst inicial
      if (btnLastTimeRef.current === 0) btnLastTimeRef.current = timestamp;

      if (timestamp - btnLastTimeRef.current >= BTN_FRAME_DURATION) {
        btnLastTimeRef.current += BTN_FRAME_DURATION;

        const phase = btnPhaseRef.current;
        let frame;

        if (phase === 'loop') {
          frame = btnLoopFramesRef.current[btnFrameRef.current];
          btnFrameRef.current = (btnFrameRef.current + 1) % (BTN_LOOP_END + 1);
        } else if (phase === 'send') {
          frame = btnSendFramesRef.current[btnFrameRef.current];
          const isLast = btnFrameRef.current >= btnSendFramesRef.current.length - 1;
          if (!isLast) {
            btnFrameRef.current++;
          } else {
            if (frame) { ctx.clearRect(0, 0, w, h); ctx.drawImage(frame, 0, 0, w, h); }
            setBtnPhaseDone(true);
            return;
          }
        }

        if (frame) { ctx.clearRect(0, 0, w, h); ctx.drawImage(frame, 0, 0, w, h); }
      }
      btnAnimRef.current = requestAnimationFrame(animate);
    };

    btnLastTimeRef.current = 0; // reset — el animate lo inicializa en el primer tick
    btnAnimRef.current = requestAnimationFrame(animate);
    return () => { if (btnAnimRef.current) cancelAnimationFrame(btnAnimRef.current); };
  }, [showContent, isBtnLoaded]);

  // Window-level click + mousemove para detectar clicks en el canvas del botón
  // (el canvas puede estar fuera del div raíz por el overflow, así que no burbujea)
  useEffect(() => {
    if (!showContent || !isBtnLoaded) return;
    const onClick    = (e) => winClickRef.current?.(e);
    const onMouseMove = (e) => winMoveRef.current?.(e);
    window.addEventListener('click',     onClick);
    window.addEventListener('mousemove', onMouseMove);
    return () => {
      window.removeEventListener('click',     onClick);
      window.removeEventListener('mousemove', onMouseMove);
      document.body.style.cursor = '';
      if (moveRafRef.current) cancelAnimationFrame(moveRafRef.current);
    };
  }, [showContent, isBtnLoaded]);

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
                disabled={enviado}
              />
            </div>
            <div
              className="contacto-field-group"
              data-error={mail.trim() && !mailValido ? 'Mail inválido' : undefined}
            >
              <input
                type="email"
                className={`contacto-field${mail.trim() && !mailValido ? ' contacto-field--invalid' : ''}`}
                placeholder="Mail"
                value={mail}
                onChange={e => setMail(e.target.value)}
                disabled={enviado}
              />
            </div>
            <div
              className="contacto-field-group"
              data-error={telefono.trim() && !telValido ? 'Teléfono inválido' : undefined}
            >
              <input
                type="tel"
                className={`contacto-field${telefono.trim() && !telValido ? ' contacto-field--invalid' : ''}`}
                placeholder="Teléfono"
                value={telefono}
                onChange={e => setTelefono(e.target.value)}
                disabled={enviado}
              />
            </div>
            <div className="contacto-field-group">
              <input
                type="text"
                className="contacto-field"
                placeholder="Descripción"
                value={descripcion}
                onChange={handleDescripcion}
                disabled={enviado}
              />
              <div className={`contacto-word-count${countWords(descripcion) >= 30 ? ' over' : ''}`}>
                {countWords(descripcion)}/30
              </div>
            </div>
          </div>

          {/* Canvas visual — siempre pointer-events:none, no bloquea el form */}
          <div className="contacto-send-area">
            {errorEnvio && <span className="contacto-status contacto-status--error">Error al enviar</span>}
            {!btnPhaseDone && isBtnLoaded && (
              <canvas
                ref={btnCanvasRef}
                className="contacto-send-canvas"
                style={{ opacity: formValido ? 1 : 0.4 }}
              />
            )}
          </div>

        </>
      )}
    </div>
  );
}

export default CardContacto;
