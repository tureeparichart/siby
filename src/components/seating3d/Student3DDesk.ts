import * as THREE from 'three';
import { Student } from '../../types';

export interface DeskAnimationState {
  time: number;
  mode: 'writing' | 'raise_hand' | 'cheering' | 'idle';
  phaseOffset: number;
  rightArmPivot: THREE.Group;
  rightForearmPivot: THREE.Group;
  leftArmPivot: THREE.Group;
  headPivot: THREE.Group;
  torsoPivot: THREE.Group;
  pencilMesh?: THREE.Mesh;
  notebookMesh?: THREE.Mesh;
  haloRing?: THREE.Mesh;
  billboardSprite?: THREE.Sprite;
  deskGroup: THREE.Group;
  deskId: string;
  studentId?: string;
  isSelected: boolean;
  hasMissingWork: boolean;
  attendanceStatus?: string;
}

// Procedural textures generator
export function createWoodTexture(isDark: boolean = false): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Warm base
    ctx.fillStyle = isDark ? '#8d5b28' : '#e0ab68';
    ctx.fillRect(0, 0, 256, 256);

    // Wood rings / grain lines
    ctx.strokeStyle = isDark ? '#73461c' : '#c9924e';
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.4;
    for (let i = 0; i < 256; i += 6) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      const wave = Math.sin(i * 0.1) * 8;
      ctx.bezierCurveTo(80, i + wave, 160, i - wave, 256, i + wave * 0.5);
      ctx.stroke();
    }
    ctx.globalAlpha = 1.0;
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createFloorTileTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Light parquet wood or clean classroom vinyl
    ctx.fillStyle = '#f3ebe1';
    ctx.fillRect(0, 0, 512, 512);

    // Grid lines for tiles
    ctx.strokeStyle = '#e2d5c3';
    ctx.lineWidth = 3;
    const tileSize = 64;
    for (let x = 0; x <= 512; x += tileSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();
    }
    for (let y = 0; y <= 512; y += tileSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }

    // Subtle grain pattern inside each tile
    ctx.fillStyle = '#ede3d5';
    for (let i = 0; i < 512; i += 16) {
      for (let j = 0; j < 512; j += 16) {
        if ((i + j) % 32 === 0) {
          ctx.fillRect(i + 2, j + 2, 12, 12);
        }
      }
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Procedural Chalkboard texture
export function createBlackboardTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 320;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Slate chalkboard dark green/charcoal
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 1024, 320);

    // Frame border
    ctx.strokeStyle = '#854d0e';
    ctx.lineWidth = 12;
    ctx.strokeRect(6, 6, 1012, 308);

    // Chalk chalkdust noise
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    for (let i = 0; i < 800; i++) {
      ctx.fillRect(Math.random() * 1024, Math.random() * 320, 2, 2);
    }

    // Title & English Chalk Writing
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px "Prompt", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🐾 Welcome to English Class! — ไซบี้ Smart Seating', 512, 70);

    ctx.font = '20px "Prompt", sans-serif';
    ctx.fillStyle = '#fef08a';
    ctx.fillText('Today: Present Perfect Tense · Subject + have/has + V.3', 512, 120);

    // Chalk English Grammar & Vocabulary doodles
    ctx.fillStyle = '#93c5fd';
    ctx.font = 'bold 18px "Prompt", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('★ Practice makes perfect!  ✓ Read & Speak', 60, 200);
    ctx.fillText('★ "Never stop learning, because life never stops teaching."', 60, 240);

    // Cute Siby paw print on the right
    ctx.fillStyle = '#fed7aa';
    ctx.font = '36px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('🐾 🐺 ✨', 960, 210);
    ctx.font = '16px "Prompt", sans-serif';
    ctx.fillText('Siby English Classroom', 960, 255);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Generate dynamic 3D floating billboard tag above student desk
export function createStudentBillboardTexture(
  deskNumber: number,
  student?: Student,
  hasMissingWork: boolean = false,
  isSelected: boolean = false,
  attendanceStatus?: string
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 384;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Clear
  ctx.clearRect(0, 0, 384, 160);

  // Background bubble
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 4;

  const bgGradient = ctx.createLinearGradient(0, 0, 0, 130);
  if (isSelected) {
    bgGradient.addColorStop(0, '#0284c7');
    bgGradient.addColorStop(1, '#0369a1');
  } else if (!student) {
    bgGradient.addColorStop(0, '#f8fafc');
    bgGradient.addColorStop(1, '#e2e8f0');
  } else if (hasMissingWork) {
    bgGradient.addColorStop(0, '#fffbeb');
    bgGradient.addColorStop(1, '#fef3c7');
  } else {
    bgGradient.addColorStop(0, '#ffffff');
    bgGradient.addColorStop(1, '#f1f5f9');
  }

  // Rounded rectangle
  ctx.fillStyle = bgGradient;
  ctx.strokeStyle = isSelected ? '#38bdf8' : hasMissingWork ? '#f59e0b' : '#cbd5e1';
  ctx.lineWidth = isSelected ? 4 : 2;

  const r = 24;
  const w = 360;
  const h = 126;
  const x = 12;
  const y = 8;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Bottom pointer triangle
  ctx.beginPath();
  ctx.moveTo(172, y + h);
  ctx.lineTo(192, y + h + 16);
  ctx.lineTo(212, y + h);
  ctx.fillStyle = isSelected ? '#0369a1' : bgGradient;
  ctx.fill();
  ctx.restore();

  // Text content
  if (student) {
    // Desk number pill
    ctx.fillStyle = isSelected ? '#38bdf8' : '#0284c7';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`#${deskNumber}`, 28, 42);

    // Student Nickname
    ctx.fillStyle = isSelected ? '#ffffff' : '#0f172a';
    ctx.font = 'bold 30px "Prompt", sans-serif';
    ctx.fillText(`${student.nickname} ${student.avatar || ''}`, 80, 44);

    // Student Number & Full Name
    ctx.fillStyle = isSelected ? '#e0f2fe' : '#64748b';
    ctx.font = '18px "Prompt", sans-serif';
    ctx.fillText(`เลขที่ ${student.studentNumber} · ${student.name.split(' ')[0]}`, 28, 80);

    // Level Badge & Status
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 20px monospace';
    ctx.fillText(`★ Lv.${student.level}`, 28, 114);

    // Status pill on right
    if (attendanceStatus && attendanceStatus !== 'present') {
      ctx.fillStyle = attendanceStatus === 'late' ? '#f59e0b' : attendanceStatus === 'leave' ? '#0ea5e9' : '#ef4444';
      ctx.font = 'bold 18px "Prompt", sans-serif';
      ctx.textAlign = 'right';
      const label = attendanceStatus === 'late' ? 'สาย ⏳' : attendanceStatus === 'leave' ? 'ลา ✉️' : 'ขาด ✕';
      ctx.fillText(label, 350, 114);
    } else if (hasMissingWork) {
      ctx.fillStyle = '#d97706';
      ctx.font = 'bold 18px "Prompt", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('⚠️ ค้างส่ง', 350, 114);
    } else {
      ctx.fillStyle = isSelected ? '#6ee7b7' : '#10b981';
      ctx.font = 'bold 18px "Prompt", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('✓ ส่งครบ', 350, 114);
    }
  } else {
    // Empty desk tag
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 22px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`#${deskNumber}`, 28, 50);

    ctx.font = 'bold 24px "Prompt", sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.fillText('(โต๊ะว่าง)', 192, 54);

    ctx.font = '18px "Prompt", sans-serif';
    ctx.fillStyle = '#0284c7';
    ctx.fillText('+ แตะเพื่อผูกนักเรียน', 192, 94);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Build a 3D Student Sitting at a School Desk with Articulated Joints
export function create3DStudentDesk(
  deskId: string,
  deskNumber: number,
  student?: Student,
  hasMissingWork: boolean = false,
  isSelected: boolean = false,
  woodTex?: THREE.Texture,
  attendanceStatus?: string
): {
  group: THREE.Group;
  animState: DeskAnimationState;
  raycastTarget: THREE.Mesh;
} {
  const deskGroup = new THREE.Group();
  deskGroup.name = `Desk_${deskId}`;

  // Shared Materials
  const deskWoodMat = new THREE.MeshStandardMaterial({
    map: woodTex || createWoodTexture(false),
    roughness: 0.45,
    metalness: 0.05,
  });

  const metalMat = new THREE.MeshStandardMaterial({
    color: 0x475569, // dark slate metal tubular frame
    roughness: 0.3,
    metalness: 0.7,
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.2,
    metalness: 0.8,
  });

  // 1. DESK TABLETOP (0.9m width x 0.55m depth x 0.04m thickness, elevated at y=0.72m)
  const tabletopGeom = new THREE.BoxGeometry(0.9, 0.04, 0.55);
  const tabletop = new THREE.Mesh(tabletopGeom, deskWoodMat);
  tabletop.position.set(0, 0.72, 0);
  tabletop.castShadow = true;
  tabletop.receiveShadow = true;
  deskGroup.add(tabletop);

  // Invisible proxy raycast mesh encompassing table & student
  const hitBoxGeom = new THREE.BoxGeometry(1.05, 1.3, 1.0);
  const hitBoxMat = new THREE.MeshBasicMaterial({ visible: false });
  const raycastTarget = new THREE.Mesh(hitBoxGeom, hitBoxMat);
  raycastTarget.position.set(0, 0.65, 0.1);
  raycastTarget.userData = { deskId, studentId: student?.id };
  deskGroup.add(raycastTarget);

  // Under-table metal book tray
  const shelfGeom = new THREE.BoxGeometry(0.82, 0.02, 0.48);
  const shelf = new THREE.Mesh(shelfGeom, metalMat);
  shelf.position.set(0, 0.6, 0);
  shelf.castShadow = true;
  deskGroup.add(shelf);

  // Desk 4 Metal Legs
  const legGeom = new THREE.CylinderGeometry(0.018, 0.018, 0.7, 8);
  const footGeom = new THREE.CylinderGeometry(0.024, 0.024, 0.03, 8);
  const footMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });

  const legOffsets = [
    [-0.4, 0.22],
    [0.4, 0.22],
    [-0.4, -0.22],
    [0.4, -0.22],
  ];

  legOffsets.forEach(([lx, lz]) => {
    const leg = new THREE.Mesh(legGeom, metalMat);
    leg.position.set(lx, 0.35, lz);
    leg.castShadow = true;
    deskGroup.add(leg);

    const foot = new THREE.Mesh(footGeom, footMat);
    foot.position.set(lx, 0.015, lz);
    deskGroup.add(foot);
  });

  // Table front modesty panel
  const panelGeom = new THREE.BoxGeometry(0.82, 0.28, 0.015);
  const panel = new THREE.Mesh(panelGeom, deskWoodMat);
  panel.position.set(0, 0.44, -0.23);
  panel.castShadow = true;
  deskGroup.add(panel);

  // 2. CHAIR (Placed behind the desk at z = +0.42m)
  const chairGroup = new THREE.Group();
  chairGroup.position.set(0, 0, 0.42);

  // Chair seat (y = 0.42m)
  const chairSeatGeom = new THREE.BoxGeometry(0.42, 0.03, 0.4);
  const chairWoodMat = new THREE.MeshStandardMaterial({
    color: 0xc89658,
    roughness: 0.5,
    metalness: 0.05,
  });
  const chairSeat = new THREE.Mesh(chairSeatGeom, chairWoodMat);
  chairSeat.position.set(0, 0.42, 0);
  chairSeat.castShadow = true;
  chairGroup.add(chairSeat);

  // Chair backrest (curved/tilted at z = +0.18m, y = 0.75m)
  const backrestGeom = new THREE.BoxGeometry(0.4, 0.18, 0.025);
  const backrest = new THREE.Mesh(backrestGeom, chairWoodMat);
  backrest.position.set(0, 0.76, 0.18);
  backrest.rotation.x = 0.08;
  backrest.castShadow = true;
  chairGroup.add(backrest);

  // Chair backrest support bars
  const chairBarGeom = new THREE.CylinderGeometry(0.012, 0.012, 0.4, 8);
  const chairBar1 = new THREE.Mesh(chairBarGeom, chromeMat);
  chairBar1.position.set(-0.16, 0.58, 0.17);
  const chairBar2 = new THREE.Mesh(chairBarGeom, chromeMat);
  chairBar2.position.set(0.16, 0.58, 0.17);
  chairGroup.add(chairBar1, chairBar2);

  // Chair Legs
  const chairLegGeom = new THREE.CylinderGeometry(0.014, 0.014, 0.42, 8);
  const chairLegOffsets = [
    [-0.17, 0.15],
    [0.17, 0.15],
    [-0.17, -0.15],
    [0.17, -0.15],
  ];
  chairLegOffsets.forEach(([cx, cz]) => {
    const cl = new THREE.Mesh(chairLegGeom, chromeMat);
    cl.position.set(cx, 0.21, cz);
    cl.castShadow = true;
    chairGroup.add(cl);
  });
  deskGroup.add(chairGroup);

  // 3. DESK PROPS (Open notebook & Pencil)
  let notebookMesh: THREE.Mesh | undefined;
  let pencilMesh: THREE.Mesh | undefined;

  const notebookGeom = new THREE.BoxGeometry(0.28, 0.008, 0.22);
  const notebookMat = new THREE.MeshStandardMaterial({
    color: student ? 0x60a5fa : 0xf1f5f9,
    roughness: 0.6,
  });
  notebookMesh = new THREE.Mesh(notebookGeom, notebookMat);
  notebookMesh.position.set(0.02, 0.745, -0.02);
  notebookMesh.rotation.y = -0.05;
  notebookMesh.castShadow = true;
  deskGroup.add(notebookMesh);

  // Drink bottle / pencil cup on top right corner
  const tumblerGeom = new THREE.CylinderGeometry(0.035, 0.03, 0.12, 12);
  const tumblerMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    roughness: 0.3,
    metalness: 0.2,
  });
  const tumbler = new THREE.Mesh(tumblerGeom, tumblerMat);
  tumbler.position.set(0.34, 0.8, -0.16);
  tumbler.castShadow = true;
  deskGroup.add(tumbler);

  // Contact shadow under desk on floor (soft grounding)
  const contactShadowGeom = new THREE.PlaneGeometry(1.2, 1.1);
  const contactShadowMat = new THREE.MeshBasicMaterial({
    color: 0x0f172a,
    transparent: true,
    opacity: 0.25,
    depthWrite: false,
  });
  const contactShadow = new THREE.Mesh(contactShadowGeom, contactShadowMat);
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.set(0, 0.005, 0.15);
  deskGroup.add(contactShadow);

  // Golden / Cyan Selection Halo Ring on floor
  const haloGeom = new THREE.RingGeometry(0.68, 0.76, 32);
  const haloMat = new THREE.MeshBasicMaterial({
    color: isSelected ? 0x38bdf8 : hasMissingWork ? 0xf59e0b : 0x10b981,
    transparent: true,
    opacity: isSelected ? 0.9 : 0.0,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const haloRing = new THREE.Mesh(haloGeom, haloMat);
  haloRing.rotation.x = -Math.PI / 2;
  haloRing.position.set(0, 0.01, 0.15);
  deskGroup.add(haloRing);

  // 4. FLOATING OVERHEAD 3D BILLBOARD SPRITE
  const spriteTex = createStudentBillboardTexture(
    deskNumber,
    student,
    hasMissingWork,
    isSelected,
    attendanceStatus
  );
  const spriteMat = new THREE.SpriteMaterial({
    map: spriteTex,
    transparent: true,
    depthWrite: false,
  });
  const billboardSprite = new THREE.Sprite(spriteMat);
  billboardSprite.scale.set(1.4, 0.58, 1);
  billboardSprite.position.set(0, 1.85, 0.25);
  deskGroup.add(billboardSprite);

  // PIVOTS for Articulated Kinematics (declared here so return always works)
  const torsoPivot = new THREE.Group();
  const headPivot = new THREE.Group();
  const leftArmPivot = new THREE.Group();
  const rightArmPivot = new THREE.Group();
  const rightForearmPivot = new THREE.Group();

  // 5. ANIMATED 3D STUDENT CHARACTER (Sitting at desk)
  if (student) {
    const studentGroup = new THREE.Group();
    studentGroup.position.set(0, 0.44, 0.38); // sitting on chair

    // Skin Tone (Thai youth natural tone)
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xffdfbe,
      roughness: 0.55,
      metalness: 0.0,
    });

    // Uniform Shirt Material (White school uniform with blue details)
    const shirtMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.6,
      metalness: 0.0,
    });

    // Pants / Skirt Material (Navy Blue / Khaki Thai student uniform)
    const isGirl = student.avatar === '👧' || student.avatar === '👩‍🦰' || student.nickname.includes('หญิง');
    const bottomMat = new THREE.MeshStandardMaterial({
      color: isGirl ? 0x1e3a8a : 0x78350f, // Navy blue skirt or khaki shorts
      roughness: 0.7,
    });

    // Hair Material (Varied brown/black shades)
    const hairColors = [0x1e293b, 0x312e81, 0x451a03, 0x172554, 0x27272a];
    const charCode = (student.name.charCodeAt(0) || 0) + deskNumber;
    const hairColor = hairColors[charCode % hairColors.length];
    const hairMat = new THREE.MeshStandardMaterial({
      color: hairColor,
      roughness: 0.7,
      metalness: 0.1,
    });

    // 5.1 Pelvis & Sitting Legs
    const pelvisGeom = new THREE.BoxGeometry(0.28, 0.12, 0.26);
    const pelvis = new THREE.Mesh(pelvisGeom, bottomMat);
    pelvis.position.set(0, 0.06, 0);
    pelvis.castShadow = true;
    studentGroup.add(pelvis);

    // Thighs (extending forward towards desk)
    const thighGeom = new THREE.BoxGeometry(0.1, 0.1, 0.28);
    const leftThigh = new THREE.Mesh(thighGeom, bottomMat);
    leftThigh.position.set(-0.09, 0.05, -0.14);
    leftThigh.castShadow = true;

    const rightThigh = new THREE.Mesh(thighGeom, bottomMat);
    rightThigh.position.set(0.09, 0.05, -0.14);
    rightThigh.castShadow = true;
    studentGroup.add(leftThigh, rightThigh);

    // Calves (pointing down to floor under desk)
    const calfGeom = new THREE.CylinderGeometry(0.04, 0.038, 0.38, 8);
    const shoeGeom = new THREE.BoxGeometry(0.08, 0.06, 0.14);
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.4 });

    const leftCalf = new THREE.Mesh(calfGeom, skinMat);
    leftCalf.position.set(-0.09, -0.22, -0.26);
    leftCalf.castShadow = true;
    const leftShoe = new THREE.Mesh(shoeGeom, shoeMat);
    leftShoe.position.set(-0.09, -0.41, -0.22);
    leftShoe.castShadow = true;

    const rightCalf = new THREE.Mesh(calfGeom, skinMat);
    rightCalf.position.set(0.09, -0.22, -0.26);
    rightCalf.castShadow = true;
    const rightShoe = new THREE.Mesh(shoeGeom, shoeMat);
    rightShoe.position.set(0.09, -0.41, -0.22);
    rightShoe.castShadow = true;

    studentGroup.add(leftCalf, leftShoe, rightCalf, rightShoe);

    // 5.2 Torso Pivot (for breathing & swaying kinematics)
    torsoPivot.position.set(0, 0.12, 0);

    const torsoGeom = new THREE.BoxGeometry(0.28, 0.32, 0.18);
    const torsoMesh = new THREE.Mesh(torsoGeom, shirtMat);
    torsoMesh.position.set(0, 0.16, 0);
    torsoMesh.castShadow = true;
    torsoPivot.add(torsoMesh);

    // School Tie / Collar detail
    const tieGeom = new THREE.BoxGeometry(0.05, 0.18, 0.015);
    const tieMat = new THREE.MeshStandardMaterial({ color: 0x1e40af, roughness: 0.4 });
    const tie = new THREE.Mesh(tieGeom, tieMat);
    tie.position.set(0, 0.2, -0.095);
    torsoPivot.add(tie);

    // Student Badge / Pin
    const badgeGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.005, 8);
    const badgeMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.2 });
    const badge = new THREE.Mesh(badgeGeom, badgeMat);
    badge.rotation.x = Math.PI / 2;
    badge.position.set(0.08, 0.24, -0.095);
    torsoPivot.add(badge);

    // 5.3 Neck and Head Pivot
    headPivot.position.set(0, 0.35, 0);

    const headGeom = new THREE.SphereGeometry(0.12, 16, 16);
    const headMesh = new THREE.Mesh(headGeom, skinMat);
    headMesh.castShadow = true;
    headPivot.add(headMesh);

    // Hair Mesh (Cute stylized 3D hair)
    const hairGeom = new THREE.SphereGeometry(0.13, 16, 14, 0, Math.PI * 2, 0, Math.PI * 0.6);
    const hairMesh = new THREE.Mesh(hairGeom, hairMat);
    hairMesh.position.set(0, 0.02, 0);
    hairMesh.castShadow = true;
    headPivot.add(hairMesh);

    // Front bangs
    const bangGeom = new THREE.BoxGeometry(0.14, 0.05, 0.06);
    const bangs = new THREE.Mesh(bangGeom, hairMat);
    bangs.position.set(0, 0.08, -0.09);
    bangs.rotation.x = 0.2;
    headPivot.add(bangs);

    if (isGirl) {
      // Girl ponytail / side hair
      const ponytailGeom = new THREE.ConeGeometry(0.06, 0.2, 8);
      const ponytail = new THREE.Mesh(ponytailGeom, hairMat);
      ponytail.rotation.x = -Math.PI / 2 - 0.4;
      ponytail.position.set(0, 0.05, 0.15);
      headPivot.add(ponytail);
    }

    // Cute Expressive Cartoon Eyes
    const eyeGeom = new THREE.SphereGeometry(0.022, 8, 8);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const leftEye = new THREE.Mesh(eyeGeom, eyeMat);
    leftEye.position.set(-0.045, 0.015, -0.11);
    const rightEye = new THREE.Mesh(eyeGeom, eyeMat);
    rightEye.position.set(0.045, 0.015, -0.11);

    // Blushing rosy cheeks
    const blushGeom = new THREE.CircleGeometry(0.02, 8);
    const blushMat = new THREE.MeshBasicMaterial({ color: 0xf43f5e, transparent: true, opacity: 0.6 });
    const leftBlush = new THREE.Mesh(blushGeom, blushMat);
    leftBlush.position.set(-0.065, -0.02, -0.11);
    leftBlush.rotation.y = -0.3;
    const rightBlush = new THREE.Mesh(blushGeom, blushMat);
    rightBlush.position.set(0.065, -0.02, -0.11);
    rightBlush.rotation.y = 0.3;

    headPivot.add(leftEye, rightEye, leftBlush, rightBlush);
    torsoPivot.add(headPivot);

    // 5.4 Left Arm (Resting comfortably on the desk)
    leftArmPivot.position.set(-0.17, 0.28, 0);
    const leftUpperArmGeom = new THREE.CylinderGeometry(0.035, 0.032, 0.18, 8);
    const leftUpperArm = new THREE.Mesh(leftUpperArmGeom, shirtMat);
    leftUpperArm.position.set(0, -0.09, 0);
    leftArmPivot.add(leftUpperArm);

    const leftForearmPivot = new THREE.Group();
    leftForearmPivot.position.set(0, -0.18, 0);
    const leftForearmGeom = new THREE.CylinderGeometry(0.03, 0.028, 0.2, 8);
    const leftForearm = new THREE.Mesh(leftForearmGeom, skinMat);
    leftForearm.position.set(0, -0.1, 0);
    leftForearmPivot.add(leftForearm);

    // Default resting angle on notebook
    leftArmPivot.rotation.x = 0.85;
    leftArmPivot.rotation.z = 0.25;
    leftForearmPivot.rotation.x = 0.6;
    leftForearmPivot.rotation.y = -0.5;
    leftArmPivot.add(leftForearmPivot);
    torsoPivot.add(leftArmPivot);

    // 5.5 Right Arm (The active animated arm for writing / raising hand)
    rightArmPivot.position.set(0.17, 0.28, 0);
    const rightUpperArmGeom = new THREE.CylinderGeometry(0.035, 0.032, 0.18, 8);
    const rightUpperArm = new THREE.Mesh(rightUpperArmGeom, shirtMat);
    rightUpperArm.position.set(0, -0.09, 0);
    rightArmPivot.add(rightUpperArm);

    rightForearmPivot.position.set(0, -0.18, 0);
    const rightForearmGeom = new THREE.CylinderGeometry(0.03, 0.028, 0.2, 8);
    const rightForearm = new THREE.Mesh(rightForearmGeom, skinMat);
    rightForearm.position.set(0, -0.1, 0);
    rightForearmPivot.add(rightForearm);

    // Cute Pencil held in right hand
    const pencilGeom = new THREE.CylinderGeometry(0.008, 0.008, 0.16, 6);
    const pencilMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4 });
    pencilMesh = new THREE.Mesh(pencilGeom, pencilMat);
    pencilMesh.position.set(0, -0.18, -0.02);
    pencilMesh.rotation.x = Math.PI / 3;
    rightForearmPivot.add(pencilMesh);

    rightArmPivot.add(rightForearmPivot);
    torsoPivot.add(rightArmPivot);

    // Attach Torso to student group
    studentGroup.add(torsoPivot);
    deskGroup.add(studentGroup);
  }

  // Animation controller state
  const animState: DeskAnimationState = {
    time: Math.random() * 10,
    mode: isSelected ? 'raise_hand' : hasMissingWork ? 'idle' : 'writing',
    phaseOffset: (deskNumber * 0.45) % (Math.PI * 2),
    rightArmPivot,
    rightForearmPivot,
    leftArmPivot,
    headPivot,
    torsoPivot,
    pencilMesh,
    notebookMesh,
    haloRing,
    billboardSprite,
    deskGroup,
    deskId,
    studentId: student?.id,
    isSelected,
    hasMissingWork,
    attendanceStatus,
  };

  return {
    group: deskGroup,
    animState,
    raycastTarget,
  };
}

// Update character animation frame by frame (smooth procedural kinematics)
export function updateStudentDeskAnimation(state: DeskAnimationState, delta: number, globalAction: string = 'auto') {
  state.time += delta;
  const t = state.time + state.phaseOffset;

  // Determine effective mode
  let effectiveMode = state.mode;
  if (globalAction === 'raise_all') {
    effectiveMode = 'raise_hand';
  } else if (globalAction === 'cheer_all') {
    effectiveMode = 'cheering';
  } else if (globalAction === 'write_all') {
    effectiveMode = 'writing';
  } else if (state.isSelected) {
    effectiveMode = 'raise_hand';
  }

  // 1. Natural idle breathing motion (torso gentle Y bobbing & scale)
  const breath = Math.sin(t * 2.8) * 0.008;
  state.torsoPivot.position.y = 0.12 + breath;
  state.torsoPivot.rotation.z = Math.sin(t * 1.2) * 0.015;

  // 2. Head looking around / tilting
  const headBob = Math.sin(t * 2.8) * 0.03;
  const headYaw = Math.sin(t * 0.7) * 0.12;

  // 3. Pose state machine
  if (effectiveMode === 'writing') {
    // Focused writing on notebook
    state.headPivot.rotation.x = 0.32 + headBob * 0.5; // looking down at notebook
    state.headPivot.rotation.y = headYaw;

    // Left arm steady on notebook holding paper
    state.leftArmPivot.rotation.x = 0.85;
    state.leftArmPivot.rotation.y = 0.1;
    state.leftArmPivot.rotation.z = 0.25;

    // Right arm realistic writing scribble motion
    const writeX = Math.sin(t * 7.5) * 0.06;
    const writeZ = Math.cos(t * 7.5) * 0.04;
    state.rightArmPivot.rotation.x = 0.82 + writeZ;
    state.rightArmPivot.rotation.y = -0.15 + writeX;
    state.rightArmPivot.rotation.z = -0.22;
    state.rightForearmPivot.rotation.x = 0.75 + writeX * 0.8;
    state.rightForearmPivot.rotation.y = 0.45;

    if (state.pencilMesh) {
      state.pencilMesh.visible = true;
    }
  } else if (effectiveMode === 'raise_hand') {
    // Enthusiastic Hand Raise to answer teacher!
    state.headPivot.rotation.x = -0.12; // looking up towards teacher
    state.headPivot.rotation.y = Math.sin(t * 1.5) * 0.08;

    // Left arm resting on desk
    state.leftArmPivot.rotation.x = 0.8;
    state.leftArmPivot.rotation.z = 0.25;

    // Right arm high in the air waving gently
    const wave = Math.sin(t * 6.0) * 0.15;
    state.rightArmPivot.rotation.x = -2.3 + wave * 0.3; // raised high
    state.rightArmPivot.rotation.y = 0.2;
    state.rightArmPivot.rotation.z = -0.3 + wave;
    state.rightForearmPivot.rotation.x = -0.3;
    state.rightForearmPivot.rotation.y = 0.1;

    if (state.pencilMesh) {
      state.pencilMesh.visible = false;
    }
  } else if (effectiveMode === 'cheering') {
    // Celebratory bounce & double hand cheer
    const cheerHop = Math.abs(Math.sin(t * 6.0)) * 0.03;
    state.torsoPivot.position.y = 0.12 + cheerHop;
    state.headPivot.rotation.x = -0.2;
    state.headPivot.rotation.y = Math.sin(t * 3.0) * 0.15;

    const cheerArmWave = Math.sin(t * 8.0) * 0.25;
    // Both arms raised high
    state.leftArmPivot.rotation.x = -2.2 + cheerArmWave;
    state.leftArmPivot.rotation.z = 0.4;
    state.rightArmPivot.rotation.x = -2.2 - cheerArmWave;
    state.rightArmPivot.rotation.z = -0.4;

    if (state.pencilMesh) {
      state.pencilMesh.visible = false;
    }
  } else {
    // Idle / sleepy or listening
    state.headPivot.rotation.x = 0.05 + headBob;
    state.headPivot.rotation.y = headYaw * 1.5;

    state.leftArmPivot.rotation.x = 0.75;
    state.leftArmPivot.rotation.z = 0.2;

    state.rightArmPivot.rotation.x = 0.75;
    state.rightArmPivot.rotation.z = -0.2;
    state.rightForearmPivot.rotation.x = 0.5;

    if (state.pencilMesh) {
      state.pencilMesh.visible = true;
    }
  }

  // Halo pulse animation if selected
  if (state.haloRing && state.isSelected) {
    const pulse = 0.75 + Math.sin(t * 5.0) * 0.2;
    (state.haloRing.material as THREE.MeshBasicMaterial).opacity = pulse;
  }
}
