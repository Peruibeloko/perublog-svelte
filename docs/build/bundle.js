
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.37.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\components\Header.svelte generated by Svelte v3.37.0 */

    const file$4 = "src\\components\\Header.svelte";

    function create_fragment$4(ctx) {
    	let header;
    	let h1;
    	let a;
    	let t1;
    	let h2;
    	let t2;
    	let br;
    	let t3;
    	let t4;
    	let div;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			header = element("header");
    			h1 = element("h1");
    			a = element("a");
    			a.textContent = "Peru";
    			t1 = space();
    			h2 = element("h2");
    			t2 = text("Não tenho muita certeza ");
    			br = element("br");
    			t3 = text("\r\n    sobre o que é tudo isso aqui");
    			t4 = space();
    			div = element("div");
    			div.textContent = "≡";
    			attr_dev(a, "href", "/");
    			attr_dev(a, "title", "ibe");
    			add_location(a, file$4, 9, 4, 215);
    			attr_dev(h1, "class", "svelte-uq40xc");
    			add_location(h1, file$4, 8, 2, 205);
    			add_location(br, file$4, 12, 28, 294);
    			attr_dev(h2, "class", "svelte-uq40xc");
    			add_location(h2, file$4, 11, 2, 260);
    			attr_dev(div, "id", "hamb");
    			attr_dev(div, "class", "svelte-uq40xc");
    			add_location(div, file$4, 15, 2, 347);
    			attr_dev(header, "class", "svelte-uq40xc");
    			add_location(header, file$4, 7, 0, 193);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			append_dev(header, h1);
    			append_dev(h1, a);
    			append_dev(header, t1);
    			append_dev(header, h2);
    			append_dev(h2, t2);
    			append_dev(h2, br);
    			append_dev(h2, t3);
    			append_dev(header, t4);
    			append_dev(header, div);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", openMobileSocials, false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function openMobileSocials() {
    	document.querySelector("#socials").classList.add("active");
    	document.querySelector("#backdrop").classList.add("active");
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Header", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ openMobileSocials });
    	return [];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src\components\Socials.svelte generated by Svelte v3.37.0 */

    const file$3 = "src\\components\\Socials.svelte";

    function create_fragment$3(ctx) {
    	let aside;
    	let h1;
    	let t1;
    	let span;
    	let t3;
    	let ul;
    	let a0;
    	let li0;
    	let t5;
    	let a1;
    	let li1;
    	let t7;
    	let a2;
    	let li2;
    	let t9;
    	let a3;
    	let li3;
    	let t11;
    	let a4;
    	let li4;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			aside = element("aside");
    			h1 = element("h1");
    			h1.textContent = "Redes";
    			t1 = space();
    			span = element("span");
    			span.textContent = "→";
    			t3 = space();
    			ul = element("ul");
    			a0 = element("a");
    			li0 = element("li");
    			li0.textContent = "SoundCloud";
    			t5 = space();
    			a1 = element("a");
    			li1 = element("li");
    			li1.textContent = "Instagram";
    			t7 = space();
    			a2 = element("a");
    			li2 = element("li");
    			li2.textContent = "Facebook";
    			t9 = space();
    			a3 = element("a");
    			li3 = element("li");
    			li3.textContent = "Twitch";
    			t11 = space();
    			a4 = element("a");
    			li4 = element("li");
    			li4.textContent = "Twitter";
    			attr_dev(h1, "class", "svelte-nxnnh8");
    			add_location(h1, file$3, 9, 2, 262);
    			attr_dev(span, "id", "close");
    			attr_dev(span, "class", "svelte-nxnnh8");
    			add_location(span, file$3, 10, 2, 280);
    			attr_dev(li0, "id", "soundcloud");
    			attr_dev(li0, "class", "svelte-nxnnh8");
    			add_location(li0, file$3, 13, 6, 413);
    			attr_dev(a0, "href", "https://soundcloud.com/dynmic");
    			attr_dev(a0, "target", "_blank");
    			attr_dev(a0, "class", "svelte-nxnnh8");
    			add_location(a0, file$3, 12, 4, 349);
    			attr_dev(li1, "id", "instagram");
    			attr_dev(li1, "class", "svelte-nxnnh8");
    			add_location(li1, file$3, 16, 6, 533);
    			attr_dev(a1, "href", "https://www.instagram.com/dyn.mic/");
    			attr_dev(a1, "target", "_blank");
    			attr_dev(a1, "class", "svelte-nxnnh8");
    			add_location(a1, file$3, 15, 4, 464);
    			attr_dev(li2, "id", "facebook");
    			attr_dev(li2, "class", "svelte-nxnnh8");
    			add_location(li2, file$3, 19, 6, 648);
    			attr_dev(a2, "href", "https://www.fb.com/dyn.mic.dnb/");
    			attr_dev(a2, "target", "_blank");
    			attr_dev(a2, "class", "svelte-nxnnh8");
    			add_location(a2, file$3, 18, 4, 582);
    			attr_dev(li3, "id", "twitch");
    			attr_dev(li3, "class", "svelte-nxnnh8");
    			add_location(li3, file$3, 22, 6, 761);
    			attr_dev(a3, "href", "https://www.twitch.tv/dynmicdnb");
    			attr_dev(a3, "target", "_blank");
    			attr_dev(a3, "class", "svelte-nxnnh8");
    			add_location(a3, file$3, 21, 4, 695);
    			attr_dev(li4, "id", "twitter");
    			attr_dev(li4, "class", "svelte-nxnnh8");
    			add_location(li4, file$3, 25, 6, 868);
    			attr_dev(a4, "href", "https://twitter.com/dynmicdnb");
    			attr_dev(a4, "target", "_blank");
    			attr_dev(a4, "class", "svelte-nxnnh8");
    			add_location(a4, file$3, 24, 4, 804);
    			attr_dev(ul, "class", "svelte-nxnnh8");
    			add_location(ul, file$3, 11, 2, 339);
    			attr_dev(aside, "id", "socials");
    			attr_dev(aside, "class", "svelte-nxnnh8");
    			add_location(aside, file$3, 8, 0, 238);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, aside, anchor);
    			append_dev(aside, h1);
    			append_dev(aside, t1);
    			append_dev(aside, span);
    			append_dev(aside, t3);
    			append_dev(aside, ul);
    			append_dev(ul, a0);
    			append_dev(a0, li0);
    			append_dev(ul, t5);
    			append_dev(ul, a1);
    			append_dev(a1, li1);
    			append_dev(ul, t7);
    			append_dev(ul, a2);
    			append_dev(a2, li2);
    			append_dev(ul, t9);
    			append_dev(ul, a3);
    			append_dev(a3, li3);
    			append_dev(ul, t11);
    			append_dev(ul, a4);
    			append_dev(a4, li4);

    			if (!mounted) {
    				dispose = listen_dev(span, "click", closeMobileSocials, false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(aside);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function closeMobileSocials() {
    	document.querySelector("#socials").classList.remove("active");
    	document.querySelector("#backdrop").classList.remove("active");
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Socials", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Socials> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ closeMobileSocials });
    	return [];
    }

    class Socials extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Socials",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function createCommonjsModule(fn) {
      var module = { exports: {} };
    	return fn(module, module.exports), module.exports;
    }

    var dayjs_min = createCommonjsModule(function (module, exports) {
    !function(t,e){module.exports=e();}(commonjsGlobal,function(){var t="millisecond",e="second",n="minute",r="hour",i="day",s="week",u="month",a="quarter",o="year",f="date",h=/^(\d{4})[-/]?(\d{1,2})?[-/]?(\d{0,2})[^0-9]*(\d{1,2})?:?(\d{1,2})?:?(\d{1,2})?[.:]?(\d+)?$/,c=/\[([^\]]+)]|Y{1,4}|M{1,4}|D{1,2}|d{1,4}|H{1,2}|h{1,2}|a|A|m{1,2}|s{1,2}|Z{1,2}|SSS/g,d={name:"en",weekdays:"Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),months:"January_February_March_April_May_June_July_August_September_October_November_December".split("_")},$=function(t,e,n){var r=String(t);return !r||r.length>=e?t:""+Array(e+1-r.length).join(n)+t},l={s:$,z:function(t){var e=-t.utcOffset(),n=Math.abs(e),r=Math.floor(n/60),i=n%60;return (e<=0?"+":"-")+$(r,2,"0")+":"+$(i,2,"0")},m:function t(e,n){if(e.date()<n.date())return -t(n,e);var r=12*(n.year()-e.year())+(n.month()-e.month()),i=e.clone().add(r,u),s=n-i<0,a=e.clone().add(r+(s?-1:1),u);return +(-(r+(n-i)/(s?i-a:a-i))||0)},a:function(t){return t<0?Math.ceil(t)||0:Math.floor(t)},p:function(h){return {M:u,y:o,w:s,d:i,D:f,h:r,m:n,s:e,ms:t,Q:a}[h]||String(h||"").toLowerCase().replace(/s$/,"")},u:function(t){return void 0===t}},y="en",M={};M[y]=d;var m=function(t){return t instanceof S},D=function(t,e,n){var r;if(!t)return y;if("string"==typeof t)M[t]&&(r=t),e&&(M[t]=e,r=t);else {var i=t.name;M[i]=t,r=i;}return !n&&r&&(y=r),r||!n&&y},v=function(t,e){if(m(t))return t.clone();var n="object"==typeof e?e:{};return n.date=t,n.args=arguments,new S(n)},g=l;g.l=D,g.i=m,g.w=function(t,e){return v(t,{locale:e.$L,utc:e.$u,x:e.$x,$offset:e.$offset})};var S=function(){function d(t){this.$L=D(t.locale,null,!0),this.parse(t);}var $=d.prototype;return $.parse=function(t){this.$d=function(t){var e=t.date,n=t.utc;if(null===e)return new Date(NaN);if(g.u(e))return new Date;if(e instanceof Date)return new Date(e);if("string"==typeof e&&!/Z$/i.test(e)){var r=e.match(h);if(r){var i=r[2]-1||0,s=(r[7]||"0").substring(0,3);return n?new Date(Date.UTC(r[1],i,r[3]||1,r[4]||0,r[5]||0,r[6]||0,s)):new Date(r[1],i,r[3]||1,r[4]||0,r[5]||0,r[6]||0,s)}}return new Date(e)}(t),this.$x=t.x||{},this.init();},$.init=function(){var t=this.$d;this.$y=t.getFullYear(),this.$M=t.getMonth(),this.$D=t.getDate(),this.$W=t.getDay(),this.$H=t.getHours(),this.$m=t.getMinutes(),this.$s=t.getSeconds(),this.$ms=t.getMilliseconds();},$.$utils=function(){return g},$.isValid=function(){return !("Invalid Date"===this.$d.toString())},$.isSame=function(t,e){var n=v(t);return this.startOf(e)<=n&&n<=this.endOf(e)},$.isAfter=function(t,e){return v(t)<this.startOf(e)},$.isBefore=function(t,e){return this.endOf(e)<v(t)},$.$g=function(t,e,n){return g.u(t)?this[e]:this.set(n,t)},$.unix=function(){return Math.floor(this.valueOf()/1e3)},$.valueOf=function(){return this.$d.getTime()},$.startOf=function(t,a){var h=this,c=!!g.u(a)||a,d=g.p(t),$=function(t,e){var n=g.w(h.$u?Date.UTC(h.$y,e,t):new Date(h.$y,e,t),h);return c?n:n.endOf(i)},l=function(t,e){return g.w(h.toDate()[t].apply(h.toDate("s"),(c?[0,0,0,0]:[23,59,59,999]).slice(e)),h)},y=this.$W,M=this.$M,m=this.$D,D="set"+(this.$u?"UTC":"");switch(d){case o:return c?$(1,0):$(31,11);case u:return c?$(1,M):$(0,M+1);case s:var v=this.$locale().weekStart||0,S=(y<v?y+7:y)-v;return $(c?m-S:m+(6-S),M);case i:case f:return l(D+"Hours",0);case r:return l(D+"Minutes",1);case n:return l(D+"Seconds",2);case e:return l(D+"Milliseconds",3);default:return this.clone()}},$.endOf=function(t){return this.startOf(t,!1)},$.$set=function(s,a){var h,c=g.p(s),d="set"+(this.$u?"UTC":""),$=(h={},h[i]=d+"Date",h[f]=d+"Date",h[u]=d+"Month",h[o]=d+"FullYear",h[r]=d+"Hours",h[n]=d+"Minutes",h[e]=d+"Seconds",h[t]=d+"Milliseconds",h)[c],l=c===i?this.$D+(a-this.$W):a;if(c===u||c===o){var y=this.clone().set(f,1);y.$d[$](l),y.init(),this.$d=y.set(f,Math.min(this.$D,y.daysInMonth())).$d;}else $&&this.$d[$](l);return this.init(),this},$.set=function(t,e){return this.clone().$set(t,e)},$.get=function(t){return this[g.p(t)]()},$.add=function(t,a){var f,h=this;t=Number(t);var c=g.p(a),d=function(e){var n=v(h);return g.w(n.date(n.date()+Math.round(e*t)),h)};if(c===u)return this.set(u,this.$M+t);if(c===o)return this.set(o,this.$y+t);if(c===i)return d(1);if(c===s)return d(7);var $=(f={},f[n]=6e4,f[r]=36e5,f[e]=1e3,f)[c]||1,l=this.$d.getTime()+t*$;return g.w(l,this)},$.subtract=function(t,e){return this.add(-1*t,e)},$.format=function(t){var e=this;if(!this.isValid())return "Invalid Date";var n=t||"YYYY-MM-DDTHH:mm:ssZ",r=g.z(this),i=this.$locale(),s=this.$H,u=this.$m,a=this.$M,o=i.weekdays,f=i.months,h=function(t,r,i,s){return t&&(t[r]||t(e,n))||i[r].substr(0,s)},d=function(t){return g.s(s%12||12,t,"0")},$=i.meridiem||function(t,e,n){var r=t<12?"AM":"PM";return n?r.toLowerCase():r},l={YY:String(this.$y).slice(-2),YYYY:this.$y,M:a+1,MM:g.s(a+1,2,"0"),MMM:h(i.monthsShort,a,f,3),MMMM:h(f,a),D:this.$D,DD:g.s(this.$D,2,"0"),d:String(this.$W),dd:h(i.weekdaysMin,this.$W,o,2),ddd:h(i.weekdaysShort,this.$W,o,3),dddd:o[this.$W],H:String(s),HH:g.s(s,2,"0"),h:d(1),hh:d(2),a:$(s,u,!0),A:$(s,u,!1),m:String(u),mm:g.s(u,2,"0"),s:String(this.$s),ss:g.s(this.$s,2,"0"),SSS:g.s(this.$ms,3,"0"),Z:r};return n.replace(c,function(t,e){return e||l[t]||r.replace(":","")})},$.utcOffset=function(){return 15*-Math.round(this.$d.getTimezoneOffset()/15)},$.diff=function(t,f,h){var c,d=g.p(f),$=v(t),l=6e4*($.utcOffset()-this.utcOffset()),y=this-$,M=g.m(this,$);return M=(c={},c[o]=M/12,c[u]=M,c[a]=M/3,c[s]=(y-l)/6048e5,c[i]=(y-l)/864e5,c[r]=y/36e5,c[n]=y/6e4,c[e]=y/1e3,c)[d]||y,h?M:g.a(M)},$.daysInMonth=function(){return this.endOf(u).$D},$.$locale=function(){return M[this.$L]},$.locale=function(t,e){if(!t)return this.$L;var n=this.clone(),r=D(t,e,!0);return r&&(n.$L=r),n},$.clone=function(){return g.w(this.$d,this)},$.toDate=function(){return new Date(this.valueOf())},$.toJSON=function(){return this.isValid()?this.toISOString():null},$.toISOString=function(){return this.$d.toISOString()},$.toString=function(){return this.$d.toUTCString()},d}(),p=S.prototype;return v.prototype=p,[["$ms",t],["$s",e],["$m",n],["$H",r],["$W",i],["$M",u],["$y",o],["$D",f]].forEach(function(t){p[t[1]]=function(e){return this.$g(e,t[0],t[1])};}),v.extend=function(t,e){return t.$i||(t(e,S,v),t.$i=!0),v},v.locale=D,v.isDayjs=m,v.unix=function(t){return v(1e3*t)},v.en=M[y],v.Ls=M,v.p={},v});
    });

    var relativeTime = createCommonjsModule(function (module, exports) {
    !function(r,t){module.exports=t();}(commonjsGlobal,function(){return function(r,t,e){r=r||{};var n=t.prototype,o={future:"in %s",past:"%s ago",s:"a few seconds",m:"a minute",mm:"%d minutes",h:"an hour",hh:"%d hours",d:"a day",dd:"%d days",M:"a month",MM:"%d months",y:"a year",yy:"%d years"};function i(r,t,e,o){return n.fromToBase(r,t,e,o)}e.en.relativeTime=o,n.fromToBase=function(t,n,i,d,u){for(var a,f,s,l=i.$locale().relativeTime||o,h=r.thresholds||[{l:"s",r:44,d:"second"},{l:"m",r:89},{l:"mm",r:44,d:"minute"},{l:"h",r:89},{l:"hh",r:21,d:"hour"},{l:"d",r:35},{l:"dd",r:25,d:"day"},{l:"M",r:45},{l:"MM",r:10,d:"month"},{l:"y",r:17},{l:"yy",d:"year"}],m=h.length,c=0;c<m;c+=1){var y=h[c];y.d&&(a=d?e(t).diff(i,y.d,!0):i.diff(t,y.d,!0));var p=(r.rounding||Math.round)(Math.abs(a));if(s=a>0,p<=y.r||!y.r){p<=1&&c>0&&(y=h[c-1]);var v=l[y.l];u&&(p=u(""+p)),f="string"==typeof v?v.replace("%d",p):v(p,n,y.l,s);break}}if(n)return f;var M=s?l.future:l.past;return "function"==typeof M?M(f):M.replace("%s",f)},n.to=function(r,t){return i(r,t,this,!0)},n.from=function(r,t){return i(r,t,this)};var d=function(r){return r.$u?e.utc():e()};n.toNow=function(r){return this.to(d(this),r)},n.fromNow=function(r){return this.from(d(this),r)};}});
    });

    createCommonjsModule(function (module, exports) {
    !function(e,o){module.exports=o(dayjs_min);}(commonjsGlobal,function(e){e=e&&e.hasOwnProperty("default")?e.default:e;var o={name:"pt-br",weekdays:"Domingo_Segunda-feira_Terça-feira_Quarta-feira_Quinta-feira_Sexta-feira_Sábado".split("_"),weekdaysShort:"Dom_Seg_Ter_Qua_Qui_Sex_Sáb".split("_"),weekdaysMin:"Do_2ª_3ª_4ª_5ª_6ª_Sá".split("_"),months:"Janeiro_Fevereiro_Março_Abril_Maio_Junho_Julho_Agosto_Setembro_Outubro_Novembro_Dezembro".split("_"),monthsShort:"Jan_Fev_Mar_Abr_Mai_Jun_Jul_Ago_Set_Out_Nov_Dez".split("_"),ordinal:function(e){return e+"º"},formats:{LT:"HH:mm",LTS:"HH:mm:ss",L:"DD/MM/YYYY",LL:"D [de] MMMM [de] YYYY",LLL:"D [de] MMMM [de] YYYY [às] HH:mm",LLLL:"dddd, D [de] MMMM [de] YYYY [às] HH:mm"},relativeTime:{future:"em %s",past:"há %s",s:"poucos segundos",m:"um minuto",mm:"%d minutos",h:"uma hora",hh:"%d horas",d:"um dia",dd:"%d dias",M:"um mês",MM:"%d meses",y:"um ano",yy:"%d anos"}};return e.locale(o,null,!0),o});
    });

    class Post {
      constructor(data) {
        dayjs_min.extend(relativeTime);
        dayjs_min.locale('pt-br');

        this.title = data?.title || 'Pô, aí não amigão...';
        this.author = data?.author || 'Carlos';
        this.datetime = data?.datetime || null;
        this.dateStrings = this.getTimeStrings(this.datetime);
        this.post = data?.post || 'Foi caçar coisa que não devia, achou nada!';
      }

      getTimeStrings(datetime) {
        return [
          datetime ? `${dayjs_min(datetime).fromNow()} atrás` : 'há 13.2Bi de anos atrás',
          datetime ? `${dayjs_min(datetime).format('DD/MM/YYYY HH[h]mm')}` : '31/02/1999 25h30'
        ];
      }
    }

    async function getPostCount() {
      const fetchData = await fetch('https://perublog.herokuapp.com/post/count');
      return await fetchData.json();
    }

    /* src\components\Post.svelte generated by Svelte v3.37.0 */
    const file$2 = "src\\components\\Post.svelte";

    function create_fragment$2(ctx) {
    	let article;
    	let h1;
    	let t0;
    	let t1;
    	let div;
    	let small0;
    	let t2;
    	let t3;
    	let t4;
    	let t5_value = /*dateStrings*/ ctx[2][0] + "";
    	let t5;
    	let t6;
    	let small1;
    	let t7_value = /*dateStrings*/ ctx[2][1] + "";
    	let t7;
    	let t8;
    	let p;

    	const block = {
    		c: function create() {
    			article = element("article");
    			h1 = element("h1");
    			t0 = text(/*title*/ ctx[0]);
    			t1 = space();
    			div = element("div");
    			small0 = element("small");
    			t2 = text("Post feito por ");
    			t3 = text(/*author*/ ctx[1]);
    			t4 = space();
    			t5 = text(t5_value);
    			t6 = space();
    			small1 = element("small");
    			t7 = text(t7_value);
    			t8 = space();
    			p = element("p");
    			attr_dev(h1, "class", "svelte-sswkhs");
    			add_location(h1, file$2, 30, 2, 796);
    			attr_dev(small0, "id", "author");
    			attr_dev(small0, "class", "svelte-sswkhs");
    			add_location(small0, file$2, 32, 4, 840);
    			attr_dev(small1, "id", "date");
    			attr_dev(small1, "class", "svelte-sswkhs");
    			add_location(small1, file$2, 33, 4, 913);
    			attr_dev(div, "class", "info svelte-sswkhs");
    			add_location(div, file$2, 31, 2, 816);
    			attr_dev(p, "class", "svelte-sswkhs");
    			add_location(p, file$2, 35, 2, 968);
    			attr_dev(article, "id", "post");
    			attr_dev(article, "class", "svelte-sswkhs");
    			add_location(article, file$2, 29, 0, 773);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, article, anchor);
    			append_dev(article, h1);
    			append_dev(h1, t0);
    			append_dev(article, t1);
    			append_dev(article, div);
    			append_dev(div, small0);
    			append_dev(small0, t2);
    			append_dev(small0, t3);
    			append_dev(small0, t4);
    			append_dev(small0, t5);
    			append_dev(div, t6);
    			append_dev(div, small1);
    			append_dev(small1, t7);
    			append_dev(article, t8);
    			append_dev(article, p);
    			p.innerHTML = /*post*/ ctx[3];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*title*/ 1) set_data_dev(t0, /*title*/ ctx[0]);
    			if (dirty & /*author*/ 2) set_data_dev(t3, /*author*/ ctx[1]);
    			if (dirty & /*dateStrings*/ 4 && t5_value !== (t5_value = /*dateStrings*/ ctx[2][0] + "")) set_data_dev(t5, t5_value);
    			if (dirty & /*dateStrings*/ 4 && t7_value !== (t7_value = /*dateStrings*/ ctx[2][1] + "")) set_data_dev(t7, t7_value);
    			if (dirty & /*post*/ 8) p.innerHTML = /*post*/ ctx[3];		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(article);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Post", slots, []);
    	let postCount;
    	let title, author, dateStrings = [], post;

    	async function hashChangeHandler() {
    		const postNum = +location.hash.slice(1);
    		const fetchData = await fetch(`http://${"perublog.herokuapp.com"}/post/${postNum || postCount}`);
    		const postData = await fetchData.json();
    		const postObject = new Post(postData);
    		$$invalidate(0, { title, author, dateStrings, post } = postObject, title, $$invalidate(1, author), $$invalidate(2, dateStrings), $$invalidate(3, post));
    	}

    	onMount(async () => {
    		postCount = await getPostCount();
    		addEventListener("hashchange", hashChangeHandler, false);
    		hashChangeHandler();
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Post> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		getPostCount,
    		Post,
    		postCount,
    		title,
    		author,
    		dateStrings,
    		post,
    		hashChangeHandler
    	});

    	$$self.$inject_state = $$props => {
    		if ("postCount" in $$props) postCount = $$props.postCount;
    		if ("title" in $$props) $$invalidate(0, title = $$props.title);
    		if ("author" in $$props) $$invalidate(1, author = $$props.author);
    		if ("dateStrings" in $$props) $$invalidate(2, dateStrings = $$props.dateStrings);
    		if ("post" in $$props) $$invalidate(3, post = $$props.post);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [title, author, dateStrings, post];
    }

    class Post_1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Post_1",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src\components\Navbar.svelte generated by Svelte v3.37.0 */
    const file$1 = "src\\components\\Navbar.svelte";

    function create_fragment$1(ctx) {
    	let nav;
    	let ul;
    	let li0;
    	let button0;
    	let t0;
    	let button0_disabled_value;
    	let t1;
    	let li1;
    	let button1;
    	let t2;
    	let button1_disabled_value;
    	let t3;
    	let li2;
    	let button2;
    	let t5;
    	let li3;
    	let button3;
    	let t6;
    	let button3_disabled_value;
    	let t7;
    	let li4;
    	let button4;
    	let t8;
    	let button4_disabled_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			ul = element("ul");
    			li0 = element("li");
    			button0 = element("button");
    			t0 = text("⇇");
    			t1 = space();
    			li1 = element("li");
    			button1 = element("button");
    			t2 = text("←");
    			t3 = space();
    			li2 = element("li");
    			button2 = element("button");
    			button2.textContent = "⤨";
    			t5 = space();
    			li3 = element("li");
    			button3 = element("button");
    			t6 = text("→");
    			t7 = space();
    			li4 = element("li");
    			button4 = element("button");
    			t8 = text("⇉");
    			attr_dev(button0, "type", "button");
    			attr_dev(button0, "id", "firstPost");
    			attr_dev(button0, "title", "Primeiro post");
    			button0.disabled = button0_disabled_value = /*disabledButtons*/ ctx[0].firstPost;
    			attr_dev(button0, "class", "svelte-3pvkcl");
    			add_location(button0, file$1, 63, 6, 1399);
    			attr_dev(li0, "class", "svelte-3pvkcl");
    			add_location(li0, file$1, 62, 4, 1387);
    			attr_dev(button1, "type", "button");
    			attr_dev(button1, "id", "previousPost");
    			attr_dev(button1, "title", "Post anterior");
    			button1.disabled = button1_disabled_value = /*disabledButtons*/ ctx[0].previousPost;
    			attr_dev(button1, "class", "svelte-3pvkcl");
    			add_location(button1, file$1, 72, 6, 1608);
    			attr_dev(li1, "class", "svelte-3pvkcl");
    			add_location(li1, file$1, 71, 4, 1596);
    			attr_dev(button2, "type", "button");
    			attr_dev(button2, "id", "randomPost");
    			attr_dev(button2, "title", "Post aleatório");
    			attr_dev(button2, "class", "svelte-3pvkcl");
    			add_location(button2, file$1, 81, 6, 1841);
    			attr_dev(li2, "class", "svelte-3pvkcl");
    			add_location(li2, file$1, 80, 4, 1829);
    			attr_dev(button3, "type", "button");
    			attr_dev(button3, "id", "nextPost");
    			attr_dev(button3, "title", "Próximo post");
    			button3.disabled = button3_disabled_value = /*disabledButtons*/ ctx[0].nextPost;
    			attr_dev(button3, "class", "svelte-3pvkcl");
    			add_location(button3, file$1, 84, 6, 1963);
    			attr_dev(li3, "class", "svelte-3pvkcl");
    			add_location(li3, file$1, 83, 4, 1951);
    			attr_dev(button4, "type", "button");
    			attr_dev(button4, "id", "lastPost");
    			attr_dev(button4, "title", "Último post");
    			button4.disabled = button4_disabled_value = /*disabledButtons*/ ctx[0].lastPost;
    			attr_dev(button4, "class", "svelte-3pvkcl");
    			add_location(button4, file$1, 93, 6, 2186);
    			attr_dev(li4, "class", "svelte-3pvkcl");
    			add_location(li4, file$1, 92, 4, 2174);
    			attr_dev(ul, "class", "svelte-3pvkcl");
    			add_location(ul, file$1, 61, 2, 1377);
    			attr_dev(nav, "id", "navlist");
    			attr_dev(nav, "class", "svelte-3pvkcl");
    			add_location(nav, file$1, 60, 0, 1355);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			append_dev(nav, ul);
    			append_dev(ul, li0);
    			append_dev(li0, button0);
    			append_dev(button0, t0);
    			append_dev(ul, t1);
    			append_dev(ul, li1);
    			append_dev(li1, button1);
    			append_dev(button1, t2);
    			append_dev(ul, t3);
    			append_dev(ul, li2);
    			append_dev(li2, button2);
    			append_dev(ul, t5);
    			append_dev(ul, li3);
    			append_dev(li3, button3);
    			append_dev(button3, t6);
    			append_dev(ul, t7);
    			append_dev(ul, li4);
    			append_dev(li4, button4);
    			append_dev(button4, t8);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", firstPost, false, false, false),
    					listen_dev(button1, "click", /*relativePost*/ ctx[1].bind(null, -1), false, false, false),
    					listen_dev(button2, "click", /*randomPost*/ ctx[2], false, false, false),
    					listen_dev(button3, "click", /*relativePost*/ ctx[1].bind(null, 1), false, false, false),
    					listen_dev(button4, "click", lastPost, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*disabledButtons*/ 1 && button0_disabled_value !== (button0_disabled_value = /*disabledButtons*/ ctx[0].firstPost)) {
    				prop_dev(button0, "disabled", button0_disabled_value);
    			}

    			if (dirty & /*disabledButtons*/ 1 && button1_disabled_value !== (button1_disabled_value = /*disabledButtons*/ ctx[0].previousPost)) {
    				prop_dev(button1, "disabled", button1_disabled_value);
    			}

    			if (dirty & /*disabledButtons*/ 1 && button3_disabled_value !== (button3_disabled_value = /*disabledButtons*/ ctx[0].nextPost)) {
    				prop_dev(button3, "disabled", button3_disabled_value);
    			}

    			if (dirty & /*disabledButtons*/ 1 && button4_disabled_value !== (button4_disabled_value = /*disabledButtons*/ ctx[0].lastPost)) {
    				prop_dev(button4, "disabled", button4_disabled_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function firstPost() {
    	location = "#1";
    }

    function lastPost() {
    	location = "";
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Navbar", slots, []);
    	let postCount;

    	let disabledButtons = {
    		firstPost: false,
    		previousPost: false,
    		nextPost: false,
    		lastPost: false
    	};

    	function relativePost(offset) {
    		const postNum = +location.hash.slice(1);

    		if (!postNum) {
    			location = `#${postCount - 1}`;
    		} else {
    			location = `#${postNum + offset}`;
    		}
    	}

    	function randomPost() {
    		const postNum = Math.round(1 + Math.random() * (postCount - 1));
    		location = `#${postNum}`;
    	}

    	function hashChangeHandler() {
    		const postNum = +location.hash.substring(1);

    		$$invalidate(0, disabledButtons = {
    			firstPost: false,
    			previousPost: false,
    			nextPost: false,
    			lastPost: false
    		});

    		if (postNum === 0 || postNum === postCount) {
    			$$invalidate(0, disabledButtons.lastPost = true, disabledButtons);
    			$$invalidate(0, disabledButtons.nextPost = true, disabledButtons);
    		} else if (postNum === 1) {
    			$$invalidate(0, disabledButtons.previousPost = true, disabledButtons);
    			$$invalidate(0, disabledButtons.firstPost = true, disabledButtons);
    		}
    	}

    	onMount(async () => {
    		postCount = await getPostCount();
    		addEventListener("hashchange", hashChangeHandler, false);
    		hashChangeHandler();
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Navbar> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		getPostCount,
    		postCount,
    		disabledButtons,
    		firstPost,
    		lastPost,
    		relativePost,
    		randomPost,
    		hashChangeHandler
    	});

    	$$self.$inject_state = $$props => {
    		if ("postCount" in $$props) postCount = $$props.postCount;
    		if ("disabledButtons" in $$props) $$invalidate(0, disabledButtons = $$props.disabledButtons);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [disabledButtons, relativePost, randomPost];
    }

    class Navbar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Navbar",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.37.0 */
    const file = "src\\App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let span;
    	let t0;
    	let header;
    	let t1;
    	let socials;
    	let t2;
    	let post;
    	let t3;
    	let navbar;
    	let current;
    	header = new Header({ $$inline: true });
    	socials = new Socials({ $$inline: true });
    	post = new Post_1({ $$inline: true });
    	navbar = new Navbar({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			span = element("span");
    			t0 = space();
    			create_component(header.$$.fragment);
    			t1 = space();
    			create_component(socials.$$.fragment);
    			t2 = space();
    			create_component(post.$$.fragment);
    			t3 = space();
    			create_component(navbar.$$.fragment);
    			attr_dev(span, "id", "backdrop");
    			attr_dev(span, "class", "svelte-gwoeow");
    			add_location(span, file, 8, 2, 254);
    			attr_dev(main, "class", "grid-container svelte-gwoeow");
    			add_location(main, file, 7, 0, 222);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, span);
    			append_dev(main, t0);
    			mount_component(header, main, null);
    			append_dev(main, t1);
    			mount_component(socials, main, null);
    			append_dev(main, t2);
    			mount_component(post, main, null);
    			append_dev(main, t3);
    			mount_component(navbar, main, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);
    			transition_in(socials.$$.fragment, local);
    			transition_in(post.$$.fragment, local);
    			transition_in(navbar.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			transition_out(socials.$$.fragment, local);
    			transition_out(post.$$.fragment, local);
    			transition_out(navbar.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(header);
    			destroy_component(socials);
    			destroy_component(post);
    			destroy_component(navbar);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Header, Socials, Post: Post_1, Navbar });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
