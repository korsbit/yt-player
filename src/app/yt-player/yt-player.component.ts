import { Component, OnInit, Input, HostBinding, HostListener, 
ViewChild, Inject, ElementRef, AfterViewInit, AfterContentInit } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Component({
	selector: 'yt-player',
	templateUrl: './yt-player.component.html',
	styleUrls: ['./yt-player.component.css']
})
export class YtPlayerComponent implements OnInit, AfterViewInit, AfterContentInit {
	constructor(@Inject(DOCUMENT) private document: Document) {
	}
	ngOnInit(): void {
		if (this.maxHeight) {
			this.videoRef.nativeElement.style.maxHeight = this.maxHeight;
		}

		if (this.minHeight) {
			this.videoRef.nativeElement.style.minHeight = this.minHeight;
		}		
	}

	ngAfterContentInit(): void {	
	}

	ngAfterViewInit(): void {
		/* Não altere essa ordem de inits */
		this.initVideo();
		this.initEvents();
		this.initObservers();
		this.initConfOptions();
		this.initConfTags();

		this.loadedRef.nativeElement.style.width = '0%';
		this.watchedRef.nativeElement.style.width = '0%';
		this.defineDragPointerPosition();	
	}

	@HostBinding('style.height') @Input() height: string = 'fit-content';
	@HostBinding('style.width') @Input() width: string = 'fit-content';	

	@Input() maxHeight: string;
	@Input() minHeight: string;

	@Input() controlsSize: number;
	@Input() theme: string;
	@Input() device: string = "desktop";
	@Input() src: { [index: string]: { src: string, fps?: string } };

	@ViewChild('playerComp', { static: true }) playerComp: ElementRef;
	@ViewChild('videoRef', { static: true }) videoRef: ElementRef;
	@ViewChild('backVideoRef', { static: false }) backVideoRef: ElementRef;
	@ViewChild('controlsRef', { static: true }) controlsRef: ElementRef;	
	@ViewChild('soundRangeRef', { static: true }) soundRangeRef: ElementRef;
	@ViewChild('watchedRef', { static: true }) watchedRef: ElementRef;
	@ViewChild('loadedRef', { static: true }) loadedRef: ElementRef;
	@ViewChild('loadBarRef', { static: true }) loadBarRef: ElementRef;
	@ViewChild('dragPointerRef', { static: true }) dragPointerRef: ElementRef;
	@ViewChild('confBoxRef', { static: true }) confBoxRef: ElementRef;
	@ViewChild('contextMenuRef', { static: true }) contextMenuRef: ElementRef;
	@ViewChild('loadBarOuterRef', { static: true }) loadBarOuterRef: ElementRef;
	@ViewChild('previewBoxRef', { static: true }) previewBoxRef: ElementRef;
	@ViewChild('confPlayBackRef', { static: true }) confPlayBackRef: ElementRef;
	@ViewChild('confQualityRef', { static: true }) confQualityRef: ElementRef;
	@ViewChild('cinemaBtnRef', { static: true }) cinemaBtnRef: ElementRef;

	paused: boolean = true;
	muted: boolean = false;

	videoSrc: string = "";
	/* Vídeo para ser utilizado na amostragem de preview */
	previewVideo: any;
	/* Posição do controle de vídeo em relação ao topo da página. Dado em px. */
	controlsTop: number;
	/* Largura do controle. */
	controlsWidth: number;
	/* 
	Estado do modo de desaparecimento do 
	controle de vídeo por inatividade. 
	*/
	controlsDA: boolean = true;
	/* 
	Quantidade de segundos até que o controle 
	de vídeo desapareça por inatividade. 
	*/
	DCount: number = 3;
	
	fullscreen: boolean = false;
	/* Estado de visibilidade do ajustador de volume do vídeo.*/
	showSR: boolean = false;
	/* Estado de visibilidade do ponto móvel  */
	showDP: boolean = false;
	/* Estado de visibilidade do menu de contexto */
	showLB: boolean = false;
	/* Estado de visibilidade da caixa de configuração do video */
	showCB: boolean = false;
	/* Estado de visibilidade da caixa de preview*/
	showPB: boolean = false;
	/* Estado de visibilidade da caixa de ajustamento de velocidade */
	showCPB: boolean = false;
	/* Estado de visibilidade  da caixa de ajustamento de qualidade*/
	showQB: boolean = false;
	/* Estado de ativação da iluminação cinematográfica */
	showBV: boolean = false;
	/* Estado de visibilidade da barra de controle do vídeo */
	showCV: boolean = false;
	/* 
	Quantidade em segundos de incremento ou decremento no atual 
	estado de reprodução do vídeo ao ser pressionado ‘ArrowLeft’ ou ‘ArrowRight’ 
	*/
	timeSkip: number = 5;
	/* Animação de reprodução do vídeo. */
	watchedAnima: Animation;
	/* Animação de carregamento do vídeo */
	loadedAnima: Animation;
	/* Animação do ponto móvel de reprodução do vídeo */
	dragPointerAnima: Animation;
	/* Opções de velocidades de reprodução suportadas */
	playBackOptions: Array<string> = ['0.25', '0.5', '0.75', 'Normal', '1.25', '1.5', '1.75', '2'];
	/* Opções de resoluções de vídeo suportadas 
	Obs: isso dependerá do argumento passado para o ‘src’ do componente */
	playQualityOptions: Array<number> = [];
	/* Objeto de configuração do vídeo */
	confOptions: { playspeed: string, cinema: boolean, quality?: number } = {playspeed: 'Normal', cinema: true};
	/* Estado de atividade do modo de loop do vídeo */
	videoLoop: boolean = false;
	/* ‘Interval’ usado para atualizar a barra de download do vídeo */
	progressChangeInterval: any;
	/* Taxa de velocidade do vídeo de fundo que cria o efeito cinematográfico */
	backVideoRate: number = 0.1;
	/* Contador de minutos do vídeo */
	videoSeconds: number = 0;
	/* Contador de segundos do vídeo */
	videoMinutes: number = 0;
	/* Estado de pressionamento do mouse na barra de vídeo */
	mouseDown: boolean = false;
	/* ‘Interval’ usado para contar a passagem do vídeo */
	videoInterval: any;

	loadBarWidth: number = 0;
	lastSoundRangeValue: number;

	duration: string;
	previewTime: string;

	Math: Math = Math;

	initVideoInterval() {
		this.videoInterval = setInterval(() => { 
			if (this.videoSeconds < 59) {
				this.videoSeconds += 1;
			} else {
				this.videoMinutes += 1;
				this.videoSeconds = 0;
			}
		}, 1000);
	}

	clearVideoInterval() {
		clearInterval(this.videoInterval);
	}

	@HostListener('window:click') onClick() {
		this.showLB = false;
		this.showCB = false;
		this.showCPB = false;
		this.showQB = false;
	}

	@HostListener('window:resize', ['$event']) onResize(event: any) {
		this.controlsTop = this.calcControlsTop();
		this.controlsWidth = this.calcControlsWidth();
	}

	@HostListener('window:keydown.space', ['$event']) onSpaceClick(event: any) {
		event.preventDefault();
	}

	@HostListener('window:keydown.ArrowLeft') onArrowLeftClick() {
		if (this.videoRef.nativeElement.currentTime - this.timeSkip <= 0) {
			this.videoRef.nativeElement.currentTime = 0;
		} else {
			this.videoRef.nativeElement.currentTime = this.videoRef.nativeElement.currentTime - this.timeSkip;

			if (this.backVideoRef) {
				this.backVideoRef.nativeElement.currentTime = this.videoRef.nativeElement.currentTime;
			}
		}
	}

	@HostListener('window:keydown.ArrowRight') onArrowRightClick() {
		if (this.videoRef.nativeElement.currentTime + this.timeSkip >= this.videoRef.nativeElement.duration) {
			this.videoRef.nativeElement.currentTime = this.videoRef.nativeElement.duration;
		} else {
			this.videoRef.nativeElement.currentTime = this.videoRef.nativeElement.currentTime + this.timeSkip;

			if (this.backVideoRef) {
				this.backVideoRef.nativeElement.currentTime = this.videoRef.nativeElement.currentTime;
			}
		}
	}

	@HostListener('mouseleave') onMouseLeave() {
		this.showCV = false;
	}

	@HostListener('mousemove') onMouseEnter() {
		this.showCV = true;
		this.DCount = 3;
	}

	@HostListener("document:fullscreenchange", []) fullScreen() {
		this.controlsTop = this.calcControlsTop();
		this.controlsWidth = this.calcControlsWidth();

		if (this.document.fullscreenElement === null) {
			this.fullscreen = false;
		}	

		this.updateWatchedAnimaComplete();
		if (!this.paused) {
			this.playAnimations();
		}
	}

	@HostListener("document:keydown.space") onSpaceKeydown() {
		this.playPauseClick();
	}

	initObservers() {
		const loadBarObserver = new ResizeObserver((entries) => {
			entries.forEach((entry) => {
				if (entry.contentBoxSize?.[0].inlineSize != this.loadBarWidth) {
					this.loadBarWidth = entry.contentBoxSize?.[0].inlineSize;
					this.updateWatchedAnimaComplete();
					
					if (!this.paused) {
						this.playAnimations();
					}

					this.defineConfBoxP(this.confBoxRef.nativeElement);
				}
			});
		});

		loadBarObserver.observe(this.loadBarRef.nativeElement);
	}

	initEvents() {
		this.videoRef.nativeElement.onloadedmetadata = () => {
			this.controlsTop = this.calcControlsTop();
			this.controlsWidth = this.calcControlsWidth();
			this.disappearCount();
			this.correctSoundRangeInput();

			this.duration = `${Math.floor(this.videoRef.nativeElement.duration / 60)}:${Math.floor(this.videoInterval.nativeElement.duration % 60)}`;
		};

		this.videoRef.nativeElement.onended = () => {
			this.paused = true;
			this.backVideoRef.nativeElement.pause();
			this.pauseAnimations();

			if (this.videoLoop) {
				this.videoRef.nativeElement.currentTime = 0;
				this.updateWatchedAnimaComplete();
				this.videoRef.nativeElement.play();
				this.paused = false;
			}
		};

		this.videoRef.nativeElement.onseeked = () => {
			this.updateWatchedAnimaComplete();
			this.playAnimations();

			if (this.paused) {
				this.pauseAnimations();
			}

			this.videoMinutes = Math.floor(this.videoRef.nativeElement.currentTime / 60);
			this.videoSeconds = +(this.videoRef.nativeElement.currentTime % 60);
		};

		this.videoRef.nativeElement.onplay = () => {
			this.playAnimations();

			if (this.backVideoRef) {
				this.backVideoRef.nativeElement.play();
			}

			this.initVideoInterval();
		}


		this.videoRef.nativeElement.onpause = () => {
			this.pauseAnimations();

			if (this.backVideoRef) {
				this.backVideoRef.nativeElement.pause();
			}

			this.clearVideoInterval();
		}

		this.playerComp.nativeElement.oncontextmenu = (event: any) => {
			event.preventDefault();
			if (!this.showLB) {
				this.showLB = true;
			}
			this.defineContextMenuP(event);
			event.stopPropagation();
		};

		this.progressChangeInterval = setInterval(() => { this.progressChange(); }, 1000);

	}

	initConfTags() {
		if (this.confOptions.cinema) {
			this.cinemaBtnRef.nativeElement.classList.remove('noactivated');
			this.cinemaBtnRef.nativeElement.classList.add('activated');
		} else {
			this.cinemaBtnRef.nativeElement.classList.add('noactivated');
			this.cinemaBtnRef.nativeElement.classList.remove('activated');
		}	
	}

	initConfOptions() {
		Object.keys(this.src).sort((a:any, b:any) => { return b - a }).forEach((value: any) => {
			this.playQualityOptions.push(+value);
		});

		this.confOptions.playspeed = 'Normal';
		this.confOptions.cinema = true;
		this.confOptions.quality = this.playQualityOptions[0];
	}

	initVideo() {
		this.previewVideo = document.createElement('video');
		this.showBV = this.confOptions.cinema;

		this.setSrcVideo();
		if (this.backVideoRef) {
			this.backVideoRef.nativeElement.muted = true;
			this.backVideoRef.nativeElement.playbackRate = this.backVideoRate;
		}
		this.videoRef.nativeElement.loop = this.videoLoop;
	}

	calcControlsTop(): number {
		var playerComp = this.playerComp.nativeElement;
		var distance = 0;

		do {
			distance += playerComp.offsetTop;
			playerComp = playerComp.offsetParent;
		} while (playerComp);

		distance = distance < 0 ? 0 : distance;

		distance += this.playerComp.nativeElement.offsetHeight - this.controlsRef.nativeElement.offsetHeight;

		return distance;
	}

	calcControlsWidth(): number {
		if (this.controlsSize && !this.fullscreen) {
			return this.controlsSize;
		}
		const p = this.videoRef.nativeElement.getBoundingClientRect().width;
		return p;
	}

	showPreview(event: any) {
		if (this.mouseDown) {
			this.loadbarClick(event);
		}

		let a = event.clientX - (this.playerComp.nativeElement.offsetLeft + this.loadBarOuterRef.nativeElement.offsetLeft);
		let b = (a / this.loadBarRef.nativeElement.getBoundingClientRect().width) * this.videoRef.nativeElement.duration;

		this.previewVideo.currentTime = b;
		let previewMinutes = Math.floor(b / 60);
		let previewSeconds = Math.floor((b % 60));

		this.previewTime = `${previewMinutes}:${previewSeconds}`;

		this.previewBoxRef.nativeElement.style.top = `${this.calcControlsTop() - this.previewBoxRef.nativeElement.offsetHeight}px`;
		this.previewBoxRef.nativeElement.style.left = `${event.clientX - (this.previewBoxRef.nativeElement.offsetWidth / 2)}px`;
		this.showPB = true;

		this.previewVideo.onseeked = () => {
			let canvasEl: any = document.getElementById("canvas");
			canvasEl.width = this.previewVideo.videoWidth;
			canvasEl.height = this.previewVideo.videoHeight;
			canvasEl.getContext('2d').drawImage(this.previewVideo, 0, 0, this.previewVideo.videoWidth, this.previewVideo.videoHeight);

			canvasEl.toBlob = (blob: any) => {
				const img = new Image();
				img.src = window.URL.createObjectURL(blob);
			};
		}

	}

	setSrcVideo(new_value?: string) {
		let de_sort: Array<string> = [];
		Object.keys(this.src).sort((a:any, b:any) => { return b - a }).forEach((value: any) => {
			de_sort.push(value);
		})	

		if (!new_value) {
			this.videoRef.nativeElement.src = this.src[de_sort[0]].src;
			this.backVideoRef.nativeElement.src = this.src[de_sort[0]].src;
			this.previewVideo.src = this.src[de_sort[0]].src;			
		} else {
			this.videoRef.nativeElement.src = new_value;
			this.backVideoRef.nativeElement.src = new_value;
			this.previewVideo.src = new_value;
		}
	}

	confQualityClick(event: any) {
		event.stopPropagation();
		this.showQB = true;
		this.showCB = false;
		this.defineConfBoxP(this.confQualityRef.nativeElement);
	}

	qualityChange(new_value: number) {
		this.confOptions.quality = new_value;
		let currentTime = this.videoRef.nativeElement.currentTime;
		this.setSrcVideo(this.src[`${new_value}`].src);
		this.videoRef.nativeElement.currentTime = currentTime;
		this.backVideoRef.nativeElement.currentTime = currentTime;
	}

	playbackChange(new_value: string) {
		var intPlayback;
		if (Number.isNaN(+new_value)) {
			intPlayback = 1;
		} else {
			intPlayback = +new_value;
		}

		if (intPlayback === 1) {
			this.confOptions.playspeed = 'Normal';
		} else {
			this.confOptions.playspeed = `${intPlayback}`;
		}

		this.videoRef.nativeElement.playbackRate = intPlayback;
		this.updateWatchedAnimaComplete();
	}

	cinemaClick() {
		this.confOptions.cinema = !this.confOptions.cinema;
		this.showBV = this.confOptions.cinema;
		this.cinemaButtonClick();
	}

	cinemaButtonClick() {
		var target = this.cinemaBtnRef.nativeElement;
		let button_list = Object.values(target.classList);
		if (button_list.includes('activated')) {
			target.classList.remove('activated');
			target.classList.add('noactivated');
		}

		else {
			target.classList.remove('noactivated');
			target.classList.add('activated')
		}		
	}

	blankClick(event: any) {
		event.stopPropagation();
	}

	confClick(event: any) {
		event.stopPropagation();
		if (this.showCB) {
			this.showCB = false;
			return;
		}

		this.defineConfBoxP(this.confBoxRef.nativeElement);
		this.showQB = false;
		this.showCPB = false;
		this.showCB = true;
	}

	loopClick() {
		this.videoLoop = !this.videoLoop;
	}

	confPlayBackClick(event: any) {
		event.stopPropagation();
		this.showCB = false;
		this.showCPB = true;
		this.defineConfBoxP(this.confPlayBackRef.nativeElement);
	}

	defineContextMenuP(event: any) {
		this.contextMenuRef.nativeElement.style.top = `${event.clientY}px`;
		this.contextMenuRef.nativeElement.style.left = `${event.clientX}px`;
	}

	defineConfBoxP(el: any) {
		let a = this.calcControlsTop();
		let b = el.getBoundingClientRect().height;
		let c = this.playerComp.nativeElement.offsetLeft;
		let d = this.videoRef.nativeElement.getBoundingClientRect().width;

		el.style.top = `${a - b}px`;
		el.style.left = `${c + d - el.offsetWidth - 10}px`;
	}

	disappearCount() {
		setInterval(() => {
			this.DCount -= 1;
			if ((this.controlsDA == true) && (!this.DCount)) {
				this.showCV = false;
			}
		}, 1000);
	}

	enterFullscreen() {
		if (this.playerComp.nativeElement.requestFullscreen) {
			this.playerComp.nativeElement.requestFullscreen();
		  } else if (this.playerComp.nativeElement.mozRequestFullScreen) { /* Firefox */
			this.playerComp.nativeElement.mozRequestFullScreen();
		  } else if (this.playerComp.nativeElement.webkitRequestFullscreen) { /* Chrome, Safari & Opera */
			this.playerComp.nativeElement.webkitRequestFullscreen();
		  } else if (this.playerComp.nativeElement.msRequestFullscreen) { /* IE/Edge */
			this.playerComp.nativeElement.msRequestFullscreen();
		  }		
	}

	exitFullscreen() {
		if (this.playerComp.nativeElement.exitFullscreen) {
			this.playerComp.nativeElement.exitFullscreen();
		  } else if (this.playerComp.nativeElement.mozExitFullScreen) { /* Firefox */
			this.playerComp.nativeElement.mozExitFullScreen();
		  } else if (this.playerComp.nativeElement.webkitExitFullscreen) { /* Chrome, Safari & Opera */
			this.playerComp.nativeElement.webkitExitFullscreen();
		  } else if (this.playerComp.nativeElement.msExitFullscreen) { /* IE/Edge */
			this.playerComp.nativeElement.msExitFullscreen();
		  }		  

		  this.document.exitFullscreen();			
	}

	fullscreenClick() {
		this.fullscreen = !this.fullscreen;

		if (this.fullscreen) {
			this.enterFullscreen();
		} else {
			this.exitFullscreen();
		}	
	}

	pauseVideo() {
		this.videoRef.nativeElement.pause();
		this.backVideoRef.nativeElement.pause();
	}

	playVideo() {
		this.videoRef.nativeElement.play();
		this.backVideoRef.nativeElement.play();
	}

	playPauseClick() {
		this.paused = !this.paused;
		if (!this.paused) {
			this.videoRef.nativeElement.play();

			this.controlsDA = true;

		} else {
			this.videoRef.nativeElement.pause();

			this.controlsDA = false;
		}
	}

	soundClick() {
		this.muted = !this.muted;
		if (this.muted) {
			this.lastSoundRangeValue = this.soundRangeRef.nativeElement.value;
			this.soundRangeRef.nativeElement.value = 0;
			this.correctSoundRangeInput();
		}

		if (!this.muted) {
			if (this.lastSoundRangeValue) {
				this.soundRangeRef.nativeElement.value = this.lastSoundRangeValue;
				this.correctSoundRangeInput();
			}
		}
		this.videoRef.nativeElement.muted = this.muted;
	}

	loadbarClick(event: any) {
		let rect = this.loadBarRef.nativeElement.getBoundingClientRect();
		this.videoRef.nativeElement.currentTime = (this.videoRef.nativeElement.duration * 
			(event.clientX - rect.left)) / this.loadBarRef.nativeElement.offsetWidth;

		if (this.backVideoRef) {
			this.backVideoRef.nativeElement.currentTime = this.videoRef.nativeElement.currentTime;
		}

		this.updateWatchedAnimaComplete();
		this.pauseAnimations();
	}

	defineDragPointerPosition() {
		var y  = this.watchedRef.nativeElement.getBoundingClientRect().top;
		var x = this.watchedRef.nativeElement.getBoundingClientRect().left;

		this.dragPointerRef.nativeElement.style.top = `${-(this.dragPointerRef.nativeElement.getBoundingClientRect().height / 4)}px`;
		this.dragPointerRef.nativeElement.style.left = `${-this.dragPointerRef.nativeElement.getBoundingClientRect().width / 2}px`;
	}

	nativeElementCollections() {
		return {vn: this.videoRef.nativeElement, ln: this.loadedRef.nativeElement, 
		lbn: this.loadBarRef.nativeElement, dn: this.dragPointerRef};
	}

	animaObj() {
		let native = this.nativeElementCollections();
		/* start of animation */
		let w_start = (native.vn.currentTime / native.vn.duration) * native.lbn.getBoundingClientRect().width;
		let l_start = (this.getBlockEnd() / native.vn.duration) * native.lbn.getBoundingClientRect().width;
		/* end of animation */
		let end = native.lbn.getBoundingClientRect().width;
		
		return {w_start, l_start, end, time: native.vn.currentTime / native.vn.playbackRate, duration: native.vn.duration / native.vn.playbackRate};
	}

	updateDragPointerAnima() {
		let anima = this.animaObj();
		let dn = this.dragPointerRef.nativeElement;
		let transform = [`translateX(${anima.w_start}px)`, `translateX(${anima.end}px)`];
		this.defineDragPointerPosition();
		this.dragPointerAnima = dn.animate({transform}, { fill: 'forwards', duration: ( anima.duration - anima.time ) * 1000 });
		this.dragPointerAnima.pause();
	}

	updateWatchedAnima() {
		let anima = this.animaObj();
		let wn = this.watchedRef.nativeElement;
		let transform = [`scaleX(${anima.w_start})`, `scaleX(${anima.end})`];
		wn.style.width = '1px';
		wn.style.transformOrigin = 'left';
		this.watchedAnima = wn.animate({transform}, { fill: 'forwards', duration: ( anima.duration - anima.time ) * 1000 });
		this.watchedAnima.pause();
	}

	updateWatchedAnimaComplete() {
		this.updateWatchedAnima();
		this.updateDragPointerAnima();
	}

	updateLoadedAnima() {
		let anima = this.animaObj();
		let ln = this.loadedRef.nativeElement;
		let transform = [`scaleX(${anima.l_start})`, `scaleX(${anima.end})`];
		this.loadedAnima = ln.animate({ transform }, { fill: 'forwards', duration: (( anima.duration - anima.time ) * 1000) * 3 });
		this.loadedAnima.pause();
	}

	pauseAnimations() {
		this.watchedAnima.ready.then(() => { this.watchedAnima.pause(); });
		this.dragPointerAnima.ready.then(() => { this.dragPointerAnima.pause(); });
	}

	playAnimations() {
		this.watchedAnima.ready.then(() => { this.watchedAnima.play(); });
		this.dragPointerAnima.ready.then(() => { this.dragPointerAnima.play(); });
	}

	getBlockEnd(): number {
		return this.videoRef.nativeElement.buffered.end(this.getCurrentBuff());
	}

	getCurrentBuff(): number {
		let vn = this.videoRef.nativeElement;
		for (let i = 0; i < vn.buffered.length; i++) {
			if (vn.currentTime >= vn.buffered.start(i) && vn.currentTime <= vn.buffered.end(i)) {
				return i;
			}
		}

		return 0;
	}

	progressChange() {
		var end = 0;
		for (let i = 0; i < this.videoRef.nativeElement.buffered.length; i++) {
			let currentTime = this.videoRef.nativeElement.currentTime;
			if (currentTime >= this.videoRef.nativeElement.buffered.start(i) && 
				currentTime <= this.videoRef.nativeElement.buffered.end(i)) {
					end = this.videoRef.nativeElement.buffered.end(i);
				}
		}

		let downloaded = (end / this.videoRef.nativeElement.duration) * 100;
		this.loadedRef.nativeElement.style.width = `${downloaded}%`;				
	}

	correctSoundRangeInput() {
		let v = (this.soundRangeRef.nativeElement.value - 
			this.soundRangeRef.nativeElement.min) / 
			(this.soundRangeRef.nativeElement.max - 
			this.soundRangeRef.nativeElement.min) * 100;
		this.soundRangeRef.nativeElement.style.background = 'linear-gradient(to right, white 0%, white ' + v 
		+ '%, rgba(156, 156, 156, .7) ' + v + '%, rgba(156, 156, 156, .7) 100%)';		
	}

	onSoundRangeInput() {
		this.correctSoundRangeInput();
		this.videoRef.nativeElement.volume = this.soundRangeRef.nativeElement.value;
	}

	onSoundRangeClick(event: any) {
		let volume = event.offsetX / event.target.offsetWidth;
		this.soundRangeRef.nativeElement.value = volume;
		this.correctSoundRangeInput();
		this.videoRef.nativeElement.volume = volume;
	}

	joinIconsPath(icon: string): string {
		return '/assets/yticons/player/' + icon + '.svg';
	}

	getBackgroundVideoWidth() {
		return `${this.videoRef.nativeElement.offsetWidth}px`;
	}

	getBackgroundVideoHeight() {
		return `${this.videoRef.nativeElement.getBoundingClientRect().height}px`;
	}
}
