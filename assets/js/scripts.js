/**
 *
 * Template name: E-Bio - Personal Portfolio HTML Template
 * Template url: http://project.kri8thm.in/html/ebio/template
 * Author: Kri8thm (kri8thm.in) <kri8thm@gmail.com>
 * Version: 1.0.0
 * Written by: Kri8thm
 * ---------------------------------------------------------------- */


const Bundle = function(win, doc, body) {

    // Integration with GSAP (GreenSock Animation Platform)
    const GS = gsap;
    GS.registerPlugin(ScrollTrigger);

    const cursorEl = doc.createElement('div');
    const outerEl = doc.createElement('div');

    const active = 'active';
    const show = 'show';

    /**
     * Retrieves the text direction
     * @returns {boolean} 
     */
    const isRTL = () => doc.documentElement.getAttribute('dir') === 'rtl';

    // Messages
    const invalidNameText = isRTL() ? "اسم خود را وارد کنید" : "Please enter your name"
    const invalidEmailText1 = isRTL() ? "ایمیل خود را وارد کنید" : "Please enter your email id";
    const invalidEmailText2 = isRTL() ? "لطفا ایمیل صحیح وارد کنید" : "Please enter valid email id";
    const emailSentText = isRTL() ? "ایمیل شما ارسال شد , با شما در تماس خواهیم بود" : "Your message has been sent. We'll be in touch with you soon";
    const emailFailedText = isRTL() ? "ارسال موفقیت آمیز نبود , لطفا دوباره تلاش کنید" : "Sending failed, Please try again later";    
    

    /**
     * Retrieves elements based on the provided selector
     * @param {string} selector - The CSS selector used to find elements
     * @returns {NodeList} 
     */
    const getElements = (selector) => {
        return typeof selector === 'string' 
            ? doc.querySelectorAll(selector) 
            : [selector];
    }

    /**
     * Checks if the element has the specified class
     * @param {Element} el - The element to check
     * @param {string} className - The class name to look for
     * @returns {boolean} 
     */
    const hasClass = (el, className) => {
        return el.className && new RegExp('(^|\\s)' + className + '(\\s|$)').test(el.className);
    }
    
    /**
     * Adds a class to the specified element(s)
     * @param {string|Element} selector - The CSS selector or element to which the class will be added
     * @param {string} className - The class to add
     */
    const addClass = (selector, className) => {
        const elements = getElements(selector);
        if (elements.length) {
            elements.forEach(element => {
                if (!hasClass(element, className)) {
                    element.classList.add(className);
                }
            });
        }
    }
    
    /**
     * Removes a class from the specified element(s)
     * @param {string|Element} selector - The CSS selector or element from which the class will be removed
     * @param {string} className - The class to remove
     */
    const removeClass = (selector, className) => {
        const elements = getElements(selector);
        if (elements.length) {
            elements.forEach(element => {
                if (hasClass(element, className)) {
                    element.classList.remove(className);
                }
            });
        }
    }

    /**
     * Checks if the window supports touch events
     * @returns {boolean}
     */
    const isTouchesEnabled = () => {
        return (
            ('ontouchstart' in win) || 
            (navigator.maxTouchPoints > 0) || 
            (navigator.msMaxTouchPoints > 0)
        );
    }

    /**
     * Injects SVG code from the 'img' src using the SVGInjector plugin
     * @see {@link https://github.com/iconic/SVGInjector}
     */
    const svgInjection = () => {
        const SVGs = getElements('img.svg');
        SVGInjector(SVGs);
    }

    /**
     * Initializes text splitting using the Splitting plugin
     * @see {@link https://splitting.js.org}
     */
    const splitting = () => {
        const lines = Splitting();
        Array.from(lines).forEach(line => {
            if (line.el.dataset.splitting === 'words') {
                const words = line.words;
                Array.from(words).forEach(word => {
                    const span = '<span class="word__inner">' + word.innerText + '</span>';
                    word.innerHTML = span;
                });
            }
        });
    }
    splitting();

    /**
     * Implements a custom scrollbar using the Lenis plugin
     * @see {@link https://lenis.darkroom.engineering}
     */
    const scrollbar = () => {
        // Class for customizing scrollbars
        const LENIS = new Lenis();
        LENIS.on("scroll", ScrollTrigger.update);
        GS.ticker.add((time) => LENIS.raf(time * 1000));
        GS.ticker.lagSmoothing(0);
    }

    /**
     * Displays a loading animation for templates using the GSAP plugin
     * @see {@link https://gsap.com/}
     */
    const loader = () => {
        setTimeout(() => {
            const loaderEl = getElements('#loader')[0];
            
            if (loaderEl) {
                const shapeEl = getElements('#loader_shape')[0];
                const pathEl = shapeEl.querySelector('path');

                addClass(loaderEl, 'loaded');
                // Animation for loading
                GS.to(loaderEl, { ease: 'sine.inOut', translateY: '-200vh', duration: 2 });
                GS.to('#loader_text .char', { ease: 'sine.in', y: -50, duration: 0.5, stagger: 0.1 });
                GS.to(pathEl, { attr: { d: pathEl.dataset.path }, duration: 1, ease: 'sine.in' });
            } 
        }, 1000);
    }

    /**
     * Implements a custom magic cursor
     */
    const cursor = () => {
        if (body.dataset.magicCursor === 'true') {
            const position = { x: 0, y: 0 };
            const page = { x: 0, y: 0 };
            const outerSpeed = 0.15;
            const size = 8;
            const outerSize = 40;

            const lerp = (start, end, amount) => (1 - amount) * start + amount * end;

            const onMouseMove = (e) => {
                page.x = e.clientX;
                page.y = e.clientY;
                cursorEl.style.left = e.clientX - size / 2 + 'px';
                cursorEl.style.top = e.clientY - size / 2 + 'px';
            }

            const follow = () => {
                position.x = lerp(position.x, page.x, outerSpeed);
                position.y = lerp(position.y, page.y, outerSpeed);
                outerEl.style.top = position.y - outerSize / 2 + 'px';
                outerEl.style.left = position.x - outerSize / 2 + 'px';
                requestAnimationFrame(follow);
            }
            follow();

            // Applies styles to the cursor
            cursorEl.id = 'cursor';
            outerEl.id = 'cursor_outer';
            cursorEl.style.setProperty('--size', size + 'px');
            outerEl.style.setProperty('--size', outerSize + 'px');
            // Adds the cursor to the DOM
            body.appendChild(outerEl);
            body.appendChild(cursorEl);

            // Implement event listener for the window.
            Bundle.onEvent(win, "mousemove", onMouseMove);
        }
    }

    /**
     * Defines the hover transition for the cursor
     */
    const cursorHoverTransition = () => {
        const links = 'a, button, input, select, textarea';

        const onMouseOver = () => {
            GS.to(cursorEl, { scale: 5, duration: .35 });
            GS.to(outerEl, { scale: 0.75, duration: .5 });
        }

        const onMouseOut = () => {
            GS.to(cursorEl, { scale: 1, duration: .35 });
            GS.to(outerEl, { scale: 1, duration: .5 });
        }

        // Implements event listeners for the element.
        Bundle.onEvent(links, "mouseover", onMouseOver);
        Bundle.onEvent(links, "mouseout", onMouseOut);
    }

    /**
     * Implements animation transition on window scroll using the intersectionObserver
     */
    const animation = () => {
        const animateEl = getElements('[data-animate]');

        const animate = (item) => {
            item.classList.add(item.dataset.animate);
            // Set animation delay using the data-animate-delay attribute of the item
            if (item.dataset.animateDelay) {
                item.style.setProperty('--animation-delay', item.dataset.animateDelay + 'ms');
            }
            // Set element width using the data-width attribute of the item
            if (item.dataset.width) {
                item.style.setProperty('--width', item.dataset.width);
            }
        }

        animateEl.forEach(item => {
            const observer = new IntersectionObserver(entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && entry.intersectionRatio >= 0.65) {
                        animate(item);    
                        // Stop observing the item once it has been animated
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.65 });

            // Immediately animate elements that are already in the viewport on page load
            if (item.getBoundingClientRect().top < window.innerHeight) {
                animate(item);
            } else {
                // Observe elements that are not yet in the viewport
                observer.observe(item);
            }
        });
    }

    /**
     * Implements a collapses
     */
    const collapses = () => {
        let isTransitioning = false;

        // Show default collapse 
        const collapseBody = doc.querySelector('.collapse__body.show');
        if (collapseBody) {
            collapseBody.style.maxHeight = collapseBody.scrollHeight + 'px';
        }

        const handleClick = (e) => {
            const link = e.currentTarget;
            const collapse = link.nextElementSibling;

            if (isTransitioning) {
                return;
            }

            if (hasClass(link, active)) {
                removeClass(link, active);
                removeClass(collapse, show);
                collapse.style.maxHeight = 0;

            } else {
                addClass(link, active);
                addClass(collapse, show);
                collapse.style.maxHeight = collapse.scrollHeight + 'px';
            }

            isTransitioning = true;
            setTimeout(() => {
                isTransitioning = false;
            }, 400);
        }

        // Implements event listeners for the element.
        Bundle.onEvent('.collapse__head', "click touchstart", handleClick);
    }

    /**
     * Implements a modal dialog
     */
    const modal = () => {
        let modalEl, dialogEl;
        
        const handleClick = (e) => {
            const link = e.currentTarget;
            modalEl = doc.querySelector(link.dataset.modal);

            if (modalEl) {
                dialogEl = modalEl.querySelector('.modal__dialog');
                body.classList.add('modal-open');
                modalEl.classList.add(show);
                dialogEl.classList.add(show);
            }
        }

        const handleClose = () => {
            if (modalEl) {
                body.classList.remove('modal-open');
                modalEl.classList.remove(show);
                dialogEl.classList.remove(show);
                modalEl = dialogEl = null;
            }
        }

        // Implements event listeners for the element.
        Bundle.onEvent('[data-modal]', "click touchstart", handleClick);
        Bundle.onEvent('[data-close="modal"]', "click touchstart", handleClose);
    }

    /**
     * Implements a marquee animation for the Swiper slider
     * @see {@link https://swiperjs.com/}
     */
    const marquee = () => {
        const elements = getElements('[data-marquee]');

        if (elements.length) {
            elements.forEach(marquee => {
                const space = parseInt(marquee.dataset.space, 10) || 32;
                const wrapEl = marquee.querySelector('.swiper-wrapper');

                // Creates clone elements of the slide
                const slideEl1 = wrapEl.cloneNode(true);
                const slideEl2 = wrapEl.cloneNode(true);
                const slideEl3 = wrapEl.cloneNode(true);
                const slides = [
                    ...slideEl1.children,
                    ...slideEl2.children,
                    ...slideEl3.children
                ];
                // Appends clone children to the wrap element
                slides.forEach(slideEl => wrapEl.appendChild(slideEl));

                const swiper = new Swiper(marquee, {
                    slidesPerView: 'auto',
                    spaceBetween: space,
                    loop: true,
                    speed: 10000,
                    allowTouchMove: false,
                    centeredSlides: true,
                    centeredSlidesBounds: true,

                    autoplay: {
                        delay: 0,
                        disableOnInteraction: false,
                    }
                });

                // Switches the swiper direction based on the text direction
                swiper.changeLanguageDirection(isRTL() ? 'rtl' : 'ltr');
            });
        }
    }

    /**
     * Implements a blob animation using the GSAP plugin
     * @see {@link https://gsap.com/}
     */
    const blobAnimation = () => {
        const path1 = 'M219 112C327 52 336 47.9998 421 18.9999C554 -19.9999 713 -7.99989 778 142C818 272 774.403 434.995 691 512C623.722 574.122 534.144 610.595 436 622C329.271 634.402 223.467 628.034 139.417 575.916C74.47 535.65 30.104 478.013 10.0888 417C-12.7611 347.346 4.76802 289.635 51 232C88 194 131 167 219 112Z';
        const path2 = 'M226.614 151.085C337.916 137.501 373.665 123.167 450.819 61.1816C565.387 -30.8351 736.303 -31.2518 785.177 144.76C822.758 280.134 786.523 448.091 703.119 525.096C635.841 587.218 541.144 624.901 443 636.306C336.271 648.709 225.467 630.034 141.417 577.916C76.47 537.65 32.104 480.013 12.0888 419C-10.7611 349.346 -1.87445 275.291 44.3575 217.656C73.7727 180.985 120.008 164.092 226.614 151.085Z';
        const path3 = 'M102.756 163.382C111.446 65.6546 138.585 27.2874 213.539 6.78776C369.876 -35.9746 528.564 133.957 642.808 218.913C731.04 284.533 828.848 371.252 792.033 491.27C750.633 626.331 557.466 686.743 448.456 598.582C370.289 535.344 340.471 532.978 242.183 582.216C132.983 636.92 73.9694 632.07 25.6724 564.416C-12.491 510.988 -4.30995 446.839 25.4201 392.347C92.8709 268.708 93.5835 266.614 102.756 163.382Z';
        
        const blobEl = doc.getElementById('blob_path');

        if (blobEl) {
            // Timeline for the blob animation
            GS.timeline({ repeat: -1, delay: 3 })
                .to(blobEl, {duration: 3, attr: {d: path3}})
                .to(blobEl, {delay: 2})
                .to(blobEl, {duration: 3, attr: {d: path2}})
                .to(blobEl, {delay: 2})
                .to(blobEl, {duration: 3, attr: {d: path1}})
                .to(blobEl, {delay: 2});
        }
    }

    /**
     * Implements a counter up animation using the GSAP plugin
     * @see {@link https://gsap.com/}
     */
    const counterUp = () => {
        const counterEl = getElements('[data-counter]');

        if (counterEl) {
            counterEl.forEach(item => {
                GS.from(item , {
                    scrollTrigger: {
                        trigger: item,
                        start: 'top bottom',
                        end: 'bottom +=50'
                    },
                    innerText: 0,
                    duration: 2,
                    snap: { innerText: 1 }
                });
            });
        }
    }

    /**
     * Implements swiper slider a plan pricing cards
     * @see {@link https://swiperjs.com/}
     */
    const pricing = () => {
        const pricingEl = doc.getElementById('pricing');

        if (pricingEl) {
            // Slider for the pricing
            const swiper = new Swiper(pricingEl, {
                speed: 400,
                spaceBetween: 16,
                slidesPerView: 1,

                scrollbar: {
                    el: pricingEl.querySelector('.swiper-scrollbar'),
                    draggable: true
                },

                breakpoints: {
                    576: {
                        slidesPerView: 1.5,
                        spaceBetween: 16
                    },
                    768: {
                        slidesPerView: 2,
                        spaceBetween: 32
                    },
                    1200: {
                        slidesPerView: 3,
                        spaceBetween: 32
                    }
                }
            });

            // Switches the swiper direction based on the text direction
            swiper.changeLanguageDirection(isRTL() ? 'rtl' : 'ltr');
        }
    }

    /**
     * Implements swiper slider with card hover animation for a blog
     * @see {@link https://swiperjs.com/}
     */
    const blog = () => {
        const blogEl = doc.getElementById('blog');

        if (blogEl) {
            // Slider for the blog
            const swiper = new Swiper(blogEl, {
                speed: 400,
                spaceBetween: 16,
                slidesPerView: 1,

                autoplay: {
                    delay: 7000,
                    pauseOnMouseEnter: true,
                    disableOnInteraction: false
                },

                scrollbar: {
                    el: blogEl.querySelector('.swiper-scrollbar'),
                    draggable: true
                },

                breakpoints: {
                    480: {
                        slidesPerView: 1.5,
                        spaceBetween: 32
                    },
                    768: {
                        slidesPerView: 2,
                        spaceBetween: 32
                    },
                    992: {
                        slidesPerView: 2.75,
                        spaceBetween: 64
                    },
                    1200: {
                        slidesPerView: 3.25,
                        spaceBetween: 80
                    },
                    1400: {
                        slidesPerView: 3.5,
                        spaceBetween: 80
                    }
                }
            });

            // Switches the swiper direction based on the text direction
            swiper.changeLanguageDirection(isRTL() ? 'rtl' : 'ltr');
        }
    }

    /**
     * Implements a contact form with form validation and event binding on controls
     */
    const contactForm = () => {
        const contactButton = document.getElementById('contact_btn');
        const name = document.getElementById('name');
        const email = document.getElementById('mail');
        const msg = document.getElementById('message');
        const nameError = document.createElement('div');
        const emailError = document.createElement('div');
        let isSubmitted = false;
        let isValid = false;

        // Validation for the name field in the contact form
        const nameValidation = () => {
            if (isSubmitted && !name.value) {
                nameError.className = 'form-error';
                nameError.innerText = invalidNameText;
                name.after(nameError);
                isValid = false;
            } else {
                nameError.remove();
                isValid = true;
            }
        }

        // Validation for the email field in the contact form
        const emailValidation = () => {
            const REG = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            if (isSubmitted && !email.value) {
                emailError.className = 'form-error';
                emailError.id = 'email_error';
                emailError.innerText = invalidEmailText1;
                email.after(emailError);
                isValid = false;

            } else if (isSubmitted && !email.value.match(REG)) {
                const el = document.getElementById('email_error');
                if (el) {
                    emailError.innerText = invalidEmailText2;
                } else {
                    emailError.className = 'form-error';
                    emailError.innerText = invalidEmailText2;
                    email.after(emailError);
                }
                isValid = false;

            } else {
                emailError.remove();
                isValid = true;
            }
        }

        // Handles the submit event for the contact form
        const sendViaFormSubmit = (data) => {
            const formMessage = document.getElementById('form_message');
            const span = document.createElement('span');
            
            // استفاده از ایمیل واقعی خودتان
            const YOUR_EMAIL = 'rhajaghaei@gmail.com'; // ← اینجا ایمیل خودتان را قرار دهید
            
            fetch(`https://formsubmit.co/ajax/${YOUR_EMAIL}`, {
                method: "POST",
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    name: data.name,
                    email: data.email,
                    message: data.msg,
                    _subject: "پیام جدید از وبسایت",
                    _template: "table",
                    _captcha: "false"
                })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('خطای شبکه');
                }
                return response.json();
            })
            .then(result => {
                console.log('پاسخ سرور:', result);
                span.innerText = "پیام با موفقیت ارسال شد!";
                span.className = 'success';
                document.querySelector('#contact_modal form').reset();
            })
            .catch(error => {
                console.error('Error:', error);
                span.innerText = "خطا در ارسال پیام. لطفا مستقیماً ایمیل بزنید.";
                span.className = 'error';
            })
            .finally(() => {
                if (formMessage.firstElementChild) {
                    formMessage.removeChild(formMessage.firstElementChild);
                }
                formMessage.appendChild(span);
                formMessage.classList.add('show');
                
                setTimeout(() => {
                    formMessage.classList.remove('show');
                }, 5000);
            });
        };
    }

    /**
     * Re-initializes necessary functions on page change
     * @param {object} data - The data associated with the page change
     */
    const pageChange = (data) => {
        // `dir` attribute change between ltr and rtl page transitions
        data?.url?.path?.includes('-rtl') ?
        doc?.documentElement?.setAttribute('dir', 'rtl') :
        doc?.documentElement?.removeAttribute('dir');

        // Initializes necessary functions
        splitting();
        svgInjection();
        animation();
        collapses();
        modal();
        marquee();
        blobAnimation();
        counterUp();
        pricing();
        blog();
        contactForm();
        cursorHoverTransition();
    }
    
    /**
     * Implements page transition animation on page enter
     * @param {string} namespace - The namespace of the animation
     * @returns {Promise}
     */
    const pageEnter = (namespace) => {
        if (namespace === 'home') {
            return GS.timeline().to(".hero", {opacity: 1})
            .to("#intro .social", {opacity: 1, y: 0}, "-=.25")
            .to("#intro .intro-title .word .word__inner", {y: 0}, "-=.25")
            .to(".navigation .navigation__item", {opacity: 1, stagger: 0.3}, "-=.25")
            .to("#email", {opacity: 0.05});

        } else {
            return GS.to("#main, #footer", {
                opacity: 1,
                y: 0,
            });
        }
    }
    
    /**
     * Implements page transition animation on page leave
     * @param {string} namespace - The namespace of the animation
     * @returns {Promise}
     */
    const pageLeave = (namespace) => {
        if (namespace === 'home') {
            return GS.timeline()
            .to("#intro .intro-title .word .word__inner", {yPercent: 105})
            .to("#intro .social", {opacity: 0}, "<")
            .to(".navigation .navigation__item", {opacity: 0}, "-=.25")
            .to(".hero, #email", {opacity: 0}, "-=.5");
        } else {
            return GS.to("#main, #footer", {
                opacity: 0,
                y: 200,
            });
        }
    }


    return {

        /**
         * Initializes a function when the window is loaded using the Barba.js plugin
         * @see {@link https://barba.js.org/}
         */
        init() {
            barba.init({
                prefetchIgnore: true,
                transitions: [{
                    async beforeLeave() {
                        const triggers = ScrollTrigger.getAll();
                        if (triggers.length) {
                            triggers.forEach(trigger => {
                                trigger.kill();
                            });
                        }

                        // Scrolls to the top and scales down the cursor after a click event
                        win.scrollTo({
                            top: 0,
                            left: 0,
                            behavior:'smooth'
                        });
                    },
                    async leave(data) {
                        await pageLeave(data.current.namespace);
                        GS.to(cursorEl, { scale: 1, duration: .35 });
                        GS.to(outerEl, { scale: 1, duration: .5 });

                        // Removes the HTML container element
                        data.current.container.remove();
                    },
                    beforeEnter(data) {
                        pageChange(data.next);
                        if (data.next.namespace !== 'home') {
                            GS.set("#main, #footer", {
                                opacity: 0,
                                y: 200,
                            });
                        }
                    },
                    async enter(data) {
                        await pageEnter(data.next.namespace);
                    },
                    async once(data) {                
                        pageChange(data.next);
                        loader();
                        scrollbar();
                        cursor();
                        
                        // Handles window events only on the first occurrence
                        Bundle.onResize();
                        Bundle.onScroll();

                        // Starts animation after the loader finishes
                        setTimeout(async () => {
                            await pageEnter(data.next.namespace);
                        }, 1000);
                    }
                }]
            });
        },

        /**
         * Adds an event listener to the element
         * @param {string|Element} selector - The CSS selector or element to which the event will be added
         * @param {string} events - The event(s) to listen for
         * @param {Function} handler - The function to execute when the event is triggered
         * @param {object} options - Additional options for the event listener
         */
        onEvent(selector, events, handler, options) {
            if (!events || typeof handler !== 'function') {
                return false;
            }

            const elements = getElements(selector);

            if (elements.length) {
                elements.forEach(element => {
                    events.split(' ').forEach(event => {
                        if (element.addEventListener) {
                            element.addEventListener(event, handler, options);
                            return true;

                        } else if (element.attachEvent) {
                            return element.attachEvent('on' + event, handler);

                        } else {
                            event = 'on' + event;
                            if (typeof element[event] === 'function') {
                                handler = (function(f1,f2){
                                    return function(){
                                        f1.apply(this, arguments);
                                        f2.apply(this, arguments);
                                    }
                                })(element[event], handler);
                            }

                            element[event] = handler;
                            return true;
                        }
                    });
                });
            }
        },

        /**
         * Handles the window resize event
         */
        onResize() {
            // Enables or disables the cursor based on window touch support
            const cursorStyle = isTouchesEnabled() ? 'none' : 'block';
            cursorEl.style.display = cursorStyle;
            outerEl.style.display = cursorStyle;
        },

        /**
         * Handles the window scroll event
         */
        onScroll() {
            // Update header class based on window scroll position
            const headerEl = doc.getElementById('header');
            if (headerEl) {
                headerEl.classList.toggle('fixed-header', win.scrollY >= 50);
            }
        }
    }

}(window, document, document.body);


const resize = () => setTimeout(Bundle.onResize, 150);

// Binds events to the window
Bundle.onEvent(window, "load", Bundle.init);
Bundle.onEvent(window, "resize", resize);
Bundle.onEvent(window, "scroll", Bundle.onScroll);