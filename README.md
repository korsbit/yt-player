### Apresentação
---
YtPlayer é um player de vídeo baseado no player do youtube. Trata-se de um pequeno projeto desenvolvido como parte de um outro projeto maior, mas que ainda encontra-se em estado de desenvolvimento.

### Instalação
1. Clone o repositório
    ~~~
    git clone https://github.com/korsbit/yt-player.git
    ~~~
2. gora, já dentro do repositório, instale os pacotes com o npm
    ~~~
    npm install
    ~~~

[HTML5.io]: https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white
[CSS3.io]: https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white
[Typescript.io]: https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white

[Angular-url]: https://angular.io/
[Angular.io]: https://img.shields.io/badge/Angular-DD0031?style=for-the-badge&logo=angular&logoColor=white

### Manual de uso
O player vem no formato de componente e possui quatro parâmetros:
- src ({qualidade: {src: caminho_do_video}}): informação sobre o vídeo a ser reproduzido
- theme (string): tema do player
- height (string): altura do player
- width (string): largura do player

Obs: Evite usar em conjunto o ‘height’ e ‘width’!

#### Exemplos
~~~html
<yt-player theme="dark" [src]="{'720': {'src': '/assets/videos/aurora.mp4'}}" height="700px" />
~~~
resultado:
    <img src="https://github.com/korsbit/yt-player/blob/main/screenshots/captura1.png"/>

Obs: Para que o efeito cinematográfico funcione corretamente, o player de vídeo deve estar sobre um elemento de cores escuras, de preferência #0F0F0F.

## Criado com

* [![HTML5][HTML5.io]][HTML5.io]
* [![CSS3][CSS3.io]][CSS3.io]
* [![Typescript][Typescript.io]][Typescript.io]
* [![Angular][Angular.io]][Angular-url]