"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * WebGL star/particle field — the deep-space layer behind everything.
 * Slow rotation + mouse parallax. Respects prefers-reduced-motion (renders a
 * single static frame), caps DPR at 2, and fully disposes on unmount.
 */
export default function Starfield() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 900);
    camera.position.z = 320;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: "low-power" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    mount.appendChild(renderer.domElement);

    // two point clouds: faint white dust + brand-blue accents
    const makeCloud = (count: number, color: number, size: number, spread: number) => {
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(count * 3);
      for (let i = 0; i < count * 3; i++) pos[i] = (Math.random() - 0.5) * spread;
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      const mat = new THREE.PointsMaterial({
        color,
        size,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const points = new THREE.Points(geo, mat);
      scene.add(points);
      return points;
    };

    const dust = makeCloud(900, 0xc3c2b7, 1.1, 800);
    const blue = makeCloud(260, 0x3987e5, 1.9, 760);
    const aqua = makeCloud(140, 0x199e70, 1.6, 720);

    let mouseX = 0;
    let mouseY = 0;
    const onMouse = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    let raf = 0;
    if (reduced) {
      renderer.render(scene, camera);
    } else {
      window.addEventListener("mousemove", onMouse);
      const tick = () => {
        dust.rotation.y += 0.00016;
        blue.rotation.y -= 0.00022;
        aqua.rotation.y += 0.0001;
        camera.position.x += (mouseX * 24 - camera.position.x) * 0.02;
        camera.position.y += (-mouseY * 16 - camera.position.y) * 0.02;
        camera.lookAt(scene.position);
        renderer.render(scene, camera);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouse);
      for (const p of [dust, blue, aqua]) {
        p.geometry.dispose();
        (p.material as THREE.Material).dispose();
      }
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0" aria-hidden />;
}
