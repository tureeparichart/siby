import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { AttendanceRecord, ClassroomLayout, Desk, Student, Submission } from '../../types';
import {
  create3DStudentDesk,
  createBlackboardTexture,
  createFloorTileTexture,
  createWoodTexture,
  DeskAnimationState,
  updateStudentDeskAnimation,
} from './Student3DDesk';

interface Classroom3DViewProps {
  layout: ClassroomLayout;
  students: Student[];
  submissions: Submission[];
  attendanceRecords?: AttendanceRecord[];
  selectedStudentIds: Set<string>;
  selectedDeskId: string | null;
  onSelectDesk: (deskId: string, studentId?: string) => void;
  onDeskClick: (desk: Desk, student?: Student) => void;
  mode: 'view' | 'edit' | 'attendance';
  isMultiSelectMode: boolean;
}

export const Classroom3DView: React.FC<Classroom3DViewProps> = ({
  layout,
  students,
  submissions,
  attendanceRecords = [],
  selectedStudentIds,
  selectedDeskId,
  onSelectDesk,
  onDeskClick,
  mode,
  isMultiSelectMode,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // Bottom dock state
  const [isControlsCollapsed, setIsControlsCollapsed] = useState(false);
  const [cameraPreset, setCameraPreset] = useState<'teacher' | 'isometric' | 'topdown' | 'side'>('isometric');
  const [globalAnimationPose, setGlobalAnimationPose] = useState<'auto' | 'write_all' | 'raise_all' | 'cheer_all'>('auto');
  const [hoveredStudentName, setHoveredStudentName] = useState<string | null>(null);

  // References for live updates without scene rebuild
  const animStatesRef = useRef<DeskAnimationState[]>([]);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const layoutRef = useRef(layout);
  layoutRef.current = layout;
  const studentsRef = useRef(students);
  studentsRef.current = students;
  const submissionsRef = useRef(submissions);
  submissionsRef.current = submissions;
  const selectedIdsRef = useRef(selectedStudentIds);
  selectedIdsRef.current = selectedStudentIds;
  const selectedDeskIdRef = useRef(selectedDeskId);
  selectedDeskIdRef.current = selectedDeskId;

  // Camera Target Interpolation
  const targetCamPos = useRef(new THREE.Vector3(0, 7.5, 9.5));
  const targetLookAt = useRef(new THREE.Vector3(0, 0.8, -0.5));

  // Switch camera presets smoothly
  const applyCameraPreset = (preset: 'teacher' | 'isometric' | 'topdown' | 'side') => {
    setCameraPreset(preset);
    if (preset === 'teacher') {
      // Behind teacher desk looking into student seats
      targetCamPos.current.set(0, 2.2, -4.6);
      targetLookAt.current.set(0, 1.0, 1.8);
    } else if (preset === 'isometric') {
      // High isometric room overview
      targetCamPos.current.set(-6.5, 8.5, 8.5);
      targetLookAt.current.set(0, 0.6, 0);
    } else if (preset === 'topdown') {
      // Straight ceiling view
      targetCamPos.current.set(0, 12.0, 0.01);
      targetLookAt.current.set(0, 0, 0);
    } else {
      // Side window viewpoint
      targetCamPos.current.set(7.5, 4.5, 1.5);
      targetLookAt.current.set(-0.5, 0.9, 0);
    }
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Software WebGL Guard (Detect software GL from GPU renderer string)
    const isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    // 2. Scene Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf1f5f9);
    scene.fog = new THREE.FogExp2(0xf1f5f9, 0.025);

    // 3. Camera Setup
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 580;
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.copy(targetCamPos.current);
    cameraRef.current = camera;

    // 4. Renderer Setup (PBR & ACES Filmic Pipeline)
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.replaceChildren(renderer.domElement);

    // 5. Studio Environment Reflection (RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 6. OrbitControls Setup
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.02; // prevent dipping under floor
    controls.minDistance = 3.0;
    controls.maxDistance = 22.0;
    controls.target.copy(targetLookAt.current);
    controlsRef.current = controls;

    // 7. Balanced 3-Point Studio Lighting Rig
    // Key Sun Light
    const keyLight = new THREE.DirectionalLight(0xfff7ed, 1.6);
    keyLight.position.set(-6, 10, -5);
    keyLight.castShadow = !isSoftwareGl;
    if (keyLight.castShadow) {
      keyLight.shadow.mapSize.width = 1024;
      keyLight.shadow.mapSize.height = 1024;
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 30;
      keyLight.shadow.camera.left = -9;
      keyLight.shadow.camera.right = 9;
      keyLight.shadow.camera.top = 9;
      keyLight.shadow.camera.bottom = -9;
      keyLight.shadow.bias = -0.0004;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    // Hemisphere Fill Light (Warm floor bounce & sky blue fill)
    const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0xfef3c7, 0.85);
    scene.add(hemiLight);

    // Window rim light
    const windowRim = new THREE.DirectionalLight(0xbae6fd, 0.7);
    windowRim.position.set(8, 6, 2);
    scene.add(windowRim);

    // 8. CLASSROOM ARCHITECTURE (Floor, Walls, Blackboard, Door, Windows, Teacher Desk)
    const roomGroup = new THREE.Group();
    scene.add(roomGroup);

    // 8.1 Classroom Floor (13m x 11m)
    const floorTex = createFloorTileTexture();
    const floorGeom = new THREE.PlaneGeometry(14, 12);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.35,
      metalness: 0.05,
    });
    const floor = new THREE.Mesh(floorGeom, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    roomGroup.add(floor);

    // 8.2 Front Wall with Chalkboard (at z = -5.5m)
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.8 });
    const frontWallGeom = new THREE.PlaneGeometry(14, 4.5);
    const frontWall = new THREE.Mesh(frontWallGeom, wallMat);
    frontWall.position.set(0, 2.25, -5.5);
    frontWall.receiveShadow = true;
    roomGroup.add(frontWall);

    // Front Chalkboard
    const blackboardTex = createBlackboardTexture();
    const blackboardGeom = new THREE.BoxGeometry(7.0, 2.2, 0.06);
    const blackboardMat = new THREE.MeshStandardMaterial({
      map: blackboardTex,
      roughness: 0.4,
    });
    const blackboard = new THREE.Mesh(blackboardGeom, blackboardMat);
    blackboard.position.set(0, 2.3, -5.44);
    blackboard.castShadow = true;
    roomGroup.add(blackboard);

    // Classroom Wall Clock above board
    const clockGeom = new THREE.CylinderGeometry(0.3, 0.3, 0.04, 24);
    const clockMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    const wallClock = new THREE.Mesh(clockGeom, clockMat);
    wallClock.rotation.x = Math.PI / 2;
    wallClock.position.set(0, 3.8, -5.45);
    roomGroup.add(wallClock);

    // 8.3 Side Windows Wall (Right side at x = +6.8m)
    const rightWallGeom = new THREE.PlaneGeometry(12, 4.5);
    const rightWall = new THREE.Mesh(rightWallGeom, wallMat);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(6.8, 2.25, 0);
    roomGroup.add(rightWall);

    // Window Frames
    const windowMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.35,
      roughness: 0.1,
    });
    const windowFrameMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });

    [-2.5, 0.5, 3.5].forEach((wz) => {
      const wGlass = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 2.2), windowMat);
      wGlass.rotation.y = -Math.PI / 2;
      wGlass.position.set(6.78, 2.3, wz);
      roomGroup.add(wGlass);

      const wFrame = new THREE.Mesh(new THREE.BoxGeometry(0.04, 2.3, 1.9), windowFrameMat);
      wFrame.position.set(6.78, 2.3, wz);
      roomGroup.add(wFrame);
    });

    // 8.4 Left Wall with Door (at x = -6.8m)
    const leftWallGeom = new THREE.PlaneGeometry(12, 4.5);
    const leftWall = new THREE.Mesh(leftWallGeom, wallMat);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-6.8, 2.25, 0);
    roomGroup.add(leftWall);

    // Door Frame & Door
    const doorGeom = new THREE.BoxGeometry(0.04, 2.6, 1.2);
    const doorMat = new THREE.MeshStandardMaterial({ color: 0xc27803, roughness: 0.4 });
    const door = new THREE.Mesh(doorGeom, doorMat);
    door.position.set(-6.76, 1.3, -3.8);
    door.castShadow = true;
    roomGroup.add(door);

    // 8.5 Teacher's Podium Desk (at z = -3.8m, x = 0m)
    const teacherWood = createWoodTexture(true);
    const teacherDeskGeom = new THREE.BoxGeometry(1.8, 0.76, 0.85);
    const teacherDeskMat = new THREE.MeshStandardMaterial({ map: teacherWood, roughness: 0.4 });
    const teacherDesk = new THREE.Mesh(teacherDeskGeom, teacherDeskMat);
    teacherDesk.position.set(0, 0.38, -3.8);
    teacherDesk.castShadow = true;
    teacherDesk.receiveShadow = true;
    roomGroup.add(teacherDesk);

    // Teacher's Laptop on desk
    const laptopBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.36, 0.015, 0.25),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.2 })
    );
    laptopBase.position.set(-0.25, 0.77, -3.8);
    const laptopScreen = new THREE.Mesh(
      new THREE.BoxGeometry(0.36, 0.24, 0.015),
      new THREE.MeshStandardMaterial({ color: 0x0ea5e9, roughness: 0.3 })
    );
    laptopScreen.position.set(-0.25, 0.88, -3.92);
    laptopScreen.rotation.x = -0.25;
    roomGroup.add(laptopBase, laptopScreen);

    // Siby Mascot miniature figure on teacher desk!
    const sibyFigGeom = new THREE.SphereGeometry(0.06, 12, 12);
    const sibyFigMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.3 });
    const sibyFig = new THREE.Mesh(sibyFigGeom, sibyFigMat);
    sibyFig.position.set(0.5, 0.82, -3.75);
    roomGroup.add(sibyFig);

    // 9. STUDENT DESKS GENERATION (Mapping layout.desks from 2D coordinates into 3D world)
    const desksGroup = new THREE.Group();
    scene.add(desksGroup);

    const deskWoodTex = createWoodTexture(false);
    const animStates: DeskAnimationState[] = [];
    const raycastTargets: THREE.Mesh[] = [];

    // Coordinate conversion: layout x% (10..90%) -> 3D X (-4.8 .. +4.8), layout y% (15..85%) -> 3D Z (-2.5 .. +4.2)
    const mapLayoutX = (pct: number) => ((pct - 50) / 100) * 10.2;
    const mapLayoutZ = (pct: number) => ((pct - 50) / 100) * 8.6;

    layout.desks.forEach((desk) => {
      const student = students.find((s) => s.id === desk.studentId);
      const hasMissingWork = student
        ? submissions.some((sub) => sub.studentId === student.id && sub.status === 'missing')
        : false;
      const isSelected = student
        ? selectedStudentIds.has(student.id) || selectedDeskId === desk.id
        : selectedDeskId === desk.id;

      // Find attendance status
      const todayStr = new Date().toISOString().slice(0, 10);
      const attRecord = attendanceRecords.find(
        (r) => r.studentId === student?.id && (r.date === todayStr || !r.date)
      );

      const desk3D = create3DStudentDesk(
        desk.id,
        desk.deskNumber,
        student,
        hasMissingWork,
        isSelected,
        deskWoodTex,
        attRecord?.status
      );

      // Position in 3D world
      const worldX = mapLayoutX(desk.x);
      const worldZ = mapLayoutZ(desk.y);
      desk3D.group.position.set(worldX, 0, worldZ);
      desk3D.group.rotation.y = (desk.rotation * Math.PI) / 180;

      desksGroup.add(desk3D.group);
      animStates.push(desk3D.animState);
      raycastTargets.push(desk3D.raycastTarget);
    });

    animStatesRef.current = animStates;

    // 10. RAYCASTING INTERACTION (Pointer hover & click)
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let pointerDownPos = { x: 0, y: 0 };

    const handlePointerDown = (e: PointerEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const handlePointerMove = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObjects(raycastTargets, false);
      if (intersects.length > 0) {
        renderer.domElement.style.cursor = 'pointer';
        const hitDeskId = intersects[0].object.userData.deskId;
        const deskObj = layoutRef.current.desks.find((d) => d.id === hitDeskId);
        const stuObj = studentsRef.current.find((s) => s.id === deskObj?.studentId);
        if (stuObj) {
          setHoveredStudentName(`โต๊ะ #${deskObj?.deskNumber} · ${stuObj.nickname} (${stuObj.name})`);
        } else {
          setHoveredStudentName(`โต๊ะ #${deskObj?.deskNumber} (โต๊ะว่าง)`);
        }
      } else {
        renderer.domElement.style.cursor = 'default';
        setHoveredStudentName(null);
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      // Discard drags (only trigger if distance is minimal)
      const dx = Math.abs(e.clientX - pointerDownPos.x);
      const dy = Math.abs(e.clientY - pointerDownPos.y);
      if (dx > 5 || dy > 5) return;

      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObjects(raycastTargets, false);
      if (intersects.length > 0) {
        const hitDeskId = intersects[0].object.userData.deskId;
        const deskObj = layoutRef.current.desks.find((d) => d.id === hitDeskId);
        if (!deskObj) return;

        const stuObj = studentsRef.current.find((s) => s.id === deskObj.studentId);
        onSelectDesk(deskObj.id, stuObj?.id);
        onDeskClick(deskObj, stuObj);
      }
    };

    const domElement = renderer.domElement;
    domElement.addEventListener('pointerdown', handlePointerDown);
    domElement.addEventListener('pointermove', handlePointerMove);
    domElement.addEventListener('pointerup', handlePointerUp);

    // 11. ANIMATION LOOP & KINEMATICS
    let frameId = 0;
    const animClock = new THREE.Clock();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    const tick = () => {
      const delta = Math.min(animClock.getDelta(), 0.1);

      // Smooth camera interpolation towards target preset
      camera.position.lerp(targetCamPos.current, 0.05);
      controls.target.lerp(targetLookAt.current, 0.05);
      controls.update();

      // Update all student kinematics & breathing
      animStates.forEach((state) => {
        updateStudentDeskAnimation(state, delta, globalAnimationPose);
      });

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    if (isSoftwareGl) {
      afterDraw(tick);
    } else {
      frameId = requestAnimationFrame(tick);
    }

    // 12. WINDOW RESIZE OBSERVER
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries[0]) return;
      const { width: newW, height: newH } = entries[0].contentRect;
      if (newW > 0 && newH > 0) {
        camera.aspect = newW / newH;
        camera.updateProjectionMatrix();
        renderer.setSize(newW, newH);
      }
    });
    resizeObserver.observe(container);

    // 13. CLEANUP
    return () => {
      resizeObserver.disconnect();
      if (isSoftwareGl) {
        clearTimeout(frameId);
      } else {
        cancelAnimationFrame(frameId);
      }
      domElement.removeEventListener('pointerdown', handlePointerDown);
      domElement.removeEventListener('pointermove', handlePointerMove);
      domElement.removeEventListener('pointerup', handlePointerUp);

      renderer.dispose();
      scene.clear();
      if (container.contains(domElement)) {
        container.removeChild(domElement);
      }
    };
  }, [layout, students, submissions, attendanceRecords, globalAnimationPose]);

  return (
    <div className="relative w-full h-[620px] rounded-2xl overflow-hidden bg-slate-900 shadow-xl border border-slate-700 select-none">
      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="w-full h-full" />

      {/* Top Floating Info Bar (Minimal, non-intrusive) */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none gap-2">
        <div className="bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 text-white flex items-center gap-2 pointer-events-auto shadow-md">
          <span className="text-sm">🐾</span>
          <div>
            <div className="text-xs font-bold flex items-center gap-1.5">
              <span>ห้องเรียน 3D ขยับได้</span>
              <span className="px-1.5 py-0.2 rounded bg-sky-500/30 text-sky-300 font-mono text-[9px] border border-sky-400/40">
                Live 3D
              </span>
            </div>
            <div className="text-[10px] text-slate-400">
              {hoveredStudentName || 'แตะที่โต๊ะนักเรียนเพื่อบวกคะแนน หรือลากเพื่อหมุนมุมมอง'}
            </div>
          </div>
        </div>

        {/* Quick Mode Status Badge */}
        <div className="bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 text-slate-200 text-xs font-semibold pointer-events-auto flex items-center gap-2 shadow-md">
          {mode === 'attendance' ? (
            <span className="text-emerald-400 flex items-center gap-1">
              <span>⏱️</span> โหมดเช็คชื่อ (แตะโต๊ะเพื่อเปลี่ยนสถานะ)
            </span>
          ) : isMultiSelectMode ? (
            <span className="text-sky-400 flex items-center gap-1">
              <span>✨</span> โหมดเลือกหลายคน (แตะโต๊ะเพื่อเลือก/ปลด)
            </span>
          ) : (
            <span className="text-amber-300 flex items-center gap-1">
              <span>⭐</span> โหมดสอนสด (แตะโต๊ะเพื่อบวกคะแนน)
            </span>
          )}
        </div>
      </div>

      {/* Collapsible Unified Bottom Control Dock (Zero Viewport Occlusion) */}
      <div
        className={`absolute bottom-3 left-1/2 -translate-x-1/2 w-[95%] max-w-2xl transition-all duration-300 z-20 pointer-events-auto ${
          isControlsCollapsed ? 'translate-y-[calc(100%-28px)]' : 'translate-y-0'
        }`}
      >
        {/* Toggle Collapse Edge Button */}
        <div className="flex justify-center -mb-px">
          <button
            type="button"
            onClick={() => setIsControlsCollapsed((prev) => !prev)}
            className="px-3 py-0.8 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white text-[11px] font-bold rounded-t-lg border-t border-x border-slate-700 shadow-md transition-colors"
          >
            {isControlsCollapsed ? '▲ ขยายแถบควบคุม 3D' : '▼ ซ่อนแถบควบคุม'}
          </button>
        </div>

        {/* Controls Container */}
        <div className="bg-slate-900/92 backdrop-blur-md p-3 rounded-2xl border border-slate-700 shadow-2xl text-white space-y-2.5">
          {/* Row 1: Camera View Presets */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
              <span>🎥</span> มุมมองกล้อง:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => applyCameraPreset('teacher')}
                className={`px-2.5 py-1 text-xs rounded-xl border transition-all ${
                  cameraPreset === 'teacher'
                    ? 'bg-sky-600 border-sky-400 text-white font-bold ring-1 ring-sky-300'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                👨‍🏫 มุมมองครู (หน้าห้อง)
              </button>
              <button
                type="button"
                onClick={() => applyCameraPreset('isometric')}
                className={`px-2.5 py-1 text-xs rounded-xl border transition-all ${
                  cameraPreset === 'isometric'
                    ? 'bg-sky-600 border-sky-400 text-white font-bold ring-1 ring-sky-300'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                📐 ไอโซเมตริก (ภาพรวม)
              </button>
              <button
                type="button"
                onClick={() => applyCameraPreset('topdown')}
                className={`px-2.5 py-1 text-xs rounded-xl border transition-all ${
                  cameraPreset === 'topdown'
                    ? 'bg-sky-600 border-sky-400 text-white font-bold ring-1 ring-sky-300'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                🔝 ผังมุมสูง
              </button>
              <button
                type="button"
                onClick={() => applyCameraPreset('side')}
                className={`px-2.5 py-1 text-xs rounded-xl border transition-all ${
                  cameraPreset === 'side'
                    ? 'bg-sky-600 border-sky-400 text-white font-bold ring-1 ring-sky-300'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                🪟 ระเบียงด้านข้าง
              </button>
            </div>
          </div>

          {/* Row 2: Student Animation Pose Action Switcher */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800 flex-wrap">
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
              <span>🕺</span> ท่าทาง 3D นักเรียน:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setGlobalAnimationPose('auto')}
                className={`px-2 py-0.8 text-xs rounded-xl border transition-all ${
                  globalAnimationPose === 'auto'
                    ? 'bg-amber-500 border-amber-300 text-slate-950 font-bold'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                🤖 อัตโนมัติตามสถานะ
              </button>
              <button
                type="button"
                onClick={() => setGlobalAnimationPose('write_all')}
                className={`px-2 py-0.8 text-xs rounded-xl border transition-all ${
                  globalAnimationPose === 'write_all'
                    ? 'bg-amber-500 border-amber-300 text-slate-950 font-bold'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                ✏️ ตั้งใจจดงานทุกคน
              </button>
              <button
                type="button"
                onClick={() => setGlobalAnimationPose('raise_all')}
                className={`px-2 py-0.8 text-xs rounded-xl border transition-all ${
                  globalAnimationPose === 'raise_all'
                    ? 'bg-amber-500 border-amber-300 text-slate-950 font-bold'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                🙋‍♂️ ยกมือตอบคำถาม
              </button>
              <button
                type="button"
                onClick={() => setGlobalAnimationPose('cheer_all')}
                className={`px-2 py-0.8 text-xs rounded-xl border transition-all ${
                  globalAnimationPose === 'cheer_all'
                    ? 'bg-amber-500 border-amber-300 text-slate-950 font-bold'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                🎉 เฮฮาดีใจสะสมแต้ม
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
