class WebGLApp {
    constructor() {
        this.container = document.getElementById('webgl-container');
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xffffff);
        this.scene.fog = new THREE.FogExp2(0xf5efe8, 0.03);

        this.camera = new THREE.PerspectiveCamera(90, this.width / this.height, 0.1, 100);
        this.camera.position.z = 5;

        const pixelRatio = window.innerWidth < 768 ? 1 : Math.min(window.devicePixelRatio, 2);
        this.renderer = new THREE.WebGLRenderer({
            antialias: window.innerWidth > 768,
            alpha: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(pixelRatio);
        this.container.appendChild(this.renderer.domElement);

        this.mouse = new THREE.Vector2();
        this.targetMouse = new THREE.Vector2();

        this.createParticles();
        this.initEvents();
        this.render();
    }

    createParticles() {
        const count = 200;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 60;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 50;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 60 - 20;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.04,
            transparent: true,
            opacity: 0.2,
            sizeAttenuation: true
        });

        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }

    initEvents() {
        window.addEventListener('resize', this.onResize.bind(this));
    }

    onResize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }

    render() {
        window.requestAnimationFrame(this.render.bind(this));

        if (this.particles) {
            this.particles.rotation.y += 0.0002;
        }

        this.renderer.render(this.scene, this.camera);
    }
}

window.ThreeScene = WebGLApp;