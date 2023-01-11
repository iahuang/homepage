
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
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
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function get_store_value(store) {
        let value;
        subscribe(store, _ => value = _)();
        return value;
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function get_all_dirty_from_scope($$scope) {
        if ($$scope.ctx.length > 32) {
            const dirty = [];
            const length = $$scope.ctx.length / 32;
            for (let i = 0; i < length; i++) {
                dirty[i] = -1;
            }
            return dirty;
        }
        return -1;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
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
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
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
    /**
     * The `onMount` function schedules a callback to run as soon as the component has been mounted to the DOM.
     * It must be called during the component's initialisation (but doesn't need to live *inside* the component;
     * it can be called from an external module).
     *
     * `onMount` does not run inside a [server-side component](/docs#run-time-server-side-component-api).
     *
     * https://svelte.dev/docs#run-time-svelte-onmount
     */
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    /**
     * Schedules a callback to run immediately before the component is unmounted.
     *
     * Out of `onMount`, `beforeUpdate`, `afterUpdate` and `onDestroy`, this is the
     * only one that runs inside a server-side component.
     *
     * https://svelte.dev/docs#run-time-svelte-ondestroy
     */
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
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
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
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
        seen_callbacks.clear();
        set_current_component(saved_component);
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
        else if (callback) {
            callback();
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
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
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
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
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
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
            if (!is_function(callback)) {
                return noop;
            }
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.55.1' }, detail), { bubbles: true }));
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

    /* src/components/Background.svelte generated by Svelte v3.55.1 */
    const file$6 = "src/components/Background.svelte";

    function create_fragment$6(ctx) {
    	let div;
    	let canvas_1;

    	const block = {
    		c: function create() {
    			div = element("div");
    			canvas_1 = element("canvas");
    			add_location(canvas_1, file$6, 41, 4, 1112);
    			attr_dev(div, "class", "background svelte-1krmnll");
    			add_location(div, file$6, 40, 0, 1083);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, canvas_1);
    			/*canvas_1_binding*/ ctx[1](canvas_1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			/*canvas_1_binding*/ ctx[1](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Background', slots, []);

    	const config = {
    		backgroundColor: "#FFFFFF",
    		dotColor: "#E3E3E3",
    		dotRadius: 2,
    		dotSpacing: 48,
    		gridOffset: 10
    	};

    	let canvas;

    	function resizeHandler() {
    		$$invalidate(0, canvas.width = window.innerWidth, canvas);
    		$$invalidate(0, canvas.height = window.innerHeight, canvas);
    		drawBackground();
    	}

    	function drawBackground() {
    		let ctx = canvas.getContext("2d");

    		// clear background
    		ctx.beginPath();

    		ctx.rect(0, 0, canvas.width, canvas.height);
    		ctx.fillStyle = "white";
    		ctx.fill();

    		// draw dots
    		ctx.fillStyle = config.dotColor;

    		for (let x = config.gridOffset; x <= canvas.width; x += config.dotSpacing) {
    			for (let y = config.gridOffset; y <= canvas.height; y += config.dotSpacing) {
    				ctx.beginPath();
    				ctx.arc(x, y, config.dotRadius, 0, 2 * Math.PI);
    				ctx.fill();
    			}
    		}
    	}

    	onMount(() => {
    		window.addEventListener("resize", resizeHandler);
    		resizeHandler();
    	});

    	onDestroy(() => {
    		window.removeEventListener("resize", resizeHandler);
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Background> was created with unknown prop '${key}'`);
    	});

    	function canvas_1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			canvas = $$value;
    			$$invalidate(0, canvas);
    		});
    	}

    	$$self.$capture_state = () => ({
    		onDestroy,
    		onMount,
    		config,
    		canvas,
    		resizeHandler,
    		drawBackground
    	});

    	$$self.$inject_state = $$props => {
    		if ('canvas' in $$props) $$invalidate(0, canvas = $$props.canvas);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [canvas, canvas_1_binding];
    }

    class Background extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Background",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src/components/ContactCard.svelte generated by Svelte v3.55.1 */

    const file$5 = "src/components/ContactCard.svelte";

    function create_fragment$5(ctx) {
    	let div4;
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let div3;
    	let div1;
    	let t1;
    	let t2;
    	let div2;
    	let t3;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			div3 = element("div");
    			div1 = element("div");
    			t1 = text(/*title*/ ctx[2]);
    			t2 = space();
    			div2 = element("div");
    			t3 = text(/*subtitle*/ ctx[3]);
    			if (!src_url_equal(img.src, img_src_value = /*iconImageURL*/ ctx[0])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "icon");
    			attr_dev(img, "class", "icon-image svelte-1pjc87j");
    			add_location(img, file$5, 14, 8, 293);
    			attr_dev(div0, "class", "svelte-1pjc87j");
    			add_location(div0, file$5, 13, 4, 279);
    			attr_dev(div1, "class", "display-name svelte-1pjc87j");
    			add_location(div1, file$5, 18, 8, 401);
    			attr_dev(div2, "class", "username svelte-1pjc87j");
    			add_location(div2, file$5, 19, 8, 449);
    			attr_dev(div3, "class", "profile-info svelte-1pjc87j");
    			add_location(div3, file$5, 17, 4, 366);
    			attr_dev(div4, "class", "contact-card svelte-1pjc87j");
    			add_location(div4, file$5, 7, 0, 172);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div0);
    			append_dev(div0, img);
    			append_dev(div4, t0);
    			append_dev(div4, div3);
    			append_dev(div3, div1);
    			append_dev(div1, t1);
    			append_dev(div3, t2);
    			append_dev(div3, div2);
    			append_dev(div2, t3);

    			if (!mounted) {
    				dispose = listen_dev(div4, "click", /*click_handler*/ ctx[4], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*iconImageURL*/ 1 && !src_url_equal(img.src, img_src_value = /*iconImageURL*/ ctx[0])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*title*/ 4) set_data_dev(t1, /*title*/ ctx[2]);
    			if (dirty & /*subtitle*/ 8) set_data_dev(t3, /*subtitle*/ ctx[3]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ContactCard', slots, []);
    	let { iconImageURL } = $$props;
    	let { targetURL } = $$props;
    	let { title } = $$props;
    	let { subtitle } = $$props;

    	$$self.$$.on_mount.push(function () {
    		if (iconImageURL === undefined && !('iconImageURL' in $$props || $$self.$$.bound[$$self.$$.props['iconImageURL']])) {
    			console.warn("<ContactCard> was created without expected prop 'iconImageURL'");
    		}

    		if (targetURL === undefined && !('targetURL' in $$props || $$self.$$.bound[$$self.$$.props['targetURL']])) {
    			console.warn("<ContactCard> was created without expected prop 'targetURL'");
    		}

    		if (title === undefined && !('title' in $$props || $$self.$$.bound[$$self.$$.props['title']])) {
    			console.warn("<ContactCard> was created without expected prop 'title'");
    		}

    		if (subtitle === undefined && !('subtitle' in $$props || $$self.$$.bound[$$self.$$.props['subtitle']])) {
    			console.warn("<ContactCard> was created without expected prop 'subtitle'");
    		}
    	});

    	const writable_props = ['iconImageURL', 'targetURL', 'title', 'subtitle'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ContactCard> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		window.location.href = targetURL;
    	};

    	$$self.$$set = $$props => {
    		if ('iconImageURL' in $$props) $$invalidate(0, iconImageURL = $$props.iconImageURL);
    		if ('targetURL' in $$props) $$invalidate(1, targetURL = $$props.targetURL);
    		if ('title' in $$props) $$invalidate(2, title = $$props.title);
    		if ('subtitle' in $$props) $$invalidate(3, subtitle = $$props.subtitle);
    	};

    	$$self.$capture_state = () => ({ iconImageURL, targetURL, title, subtitle });

    	$$self.$inject_state = $$props => {
    		if ('iconImageURL' in $$props) $$invalidate(0, iconImageURL = $$props.iconImageURL);
    		if ('targetURL' in $$props) $$invalidate(1, targetURL = $$props.targetURL);
    		if ('title' in $$props) $$invalidate(2, title = $$props.title);
    		if ('subtitle' in $$props) $$invalidate(3, subtitle = $$props.subtitle);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [iconImageURL, targetURL, title, subtitle, click_handler];
    }

    class ContactCard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {
    			iconImageURL: 0,
    			targetURL: 1,
    			title: 2,
    			subtitle: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ContactCard",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get iconImageURL() {
    		throw new Error("<ContactCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set iconImageURL(value) {
    		throw new Error("<ContactCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get targetURL() {
    		throw new Error("<ContactCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set targetURL(value) {
    		throw new Error("<ContactCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<ContactCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<ContactCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get subtitle() {
    		throw new Error("<ContactCard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set subtitle(value) {
    		throw new Error("<ContactCard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/DefaultStyledWindowContainer.svelte generated by Svelte v3.55.1 */

    const file$4 = "src/components/DefaultStyledWindowContainer.svelte";

    function create_fragment$4(ctx) {
    	let div;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", "container svelte-18zkz8t");
    			add_location(div, file$4, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 1)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[0],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[0])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[0], dirty, null),
    						null
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
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

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('DefaultStyledWindowContainer', slots, ['default']);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<DefaultStyledWindowContainer> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('$$scope' in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	return [$$scope, slots];
    }

    class DefaultStyledWindowContainer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DefaultStyledWindowContainer",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/components/ProjectTile.svelte generated by Svelte v3.55.1 */

    const file$3 = "src/components/ProjectTile.svelte";

    function create_fragment$3(ctx) {
    	let div9;
    	let div3;
    	let div0;
    	let t0;
    	let div1;
    	let t1;
    	let div2;
    	let t2;
    	let div4;
    	let img;
    	let img_src_value;
    	let t3;
    	let div8;
    	let div7;
    	let div5;
    	let t4;
    	let t5;
    	let div6;
    	let t6_value = /*projectName*/ ctx[0].toLowerCase().replace(" ", "_").replace("-", "_") + "";
    	let t6;
    	let t7;

    	const block = {
    		c: function create() {
    			div9 = element("div");
    			div3 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div1 = element("div");
    			t1 = space();
    			div2 = element("div");
    			t2 = space();
    			div4 = element("div");
    			img = element("img");
    			t3 = space();
    			div8 = element("div");
    			div7 = element("div");
    			div5 = element("div");
    			t4 = text(/*projectName*/ ctx[0]);
    			t5 = space();
    			div6 = element("div");
    			t6 = text(t6_value);
    			t7 = text(".proj");
    			attr_dev(div0, "class", "svelte-1lcfozi");
    			add_location(div0, file$3, 7, 8, 162);
    			attr_dev(div1, "class", "svelte-1lcfozi");
    			add_location(div1, file$3, 8, 8, 182);
    			attr_dev(div2, "class", "svelte-1lcfozi");
    			add_location(div2, file$3, 9, 8, 202);
    			attr_dev(div3, "class", "ellipsis svelte-1lcfozi");
    			add_location(div3, file$3, 6, 4, 131);
    			attr_dev(img, "class", "project-icon svelte-1lcfozi");
    			if (!src_url_equal(img.src, img_src_value = "/images/app.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "App icon");
    			add_location(img, file$3, 12, 8, 260);
    			attr_dev(div4, "class", "centered svelte-1lcfozi");
    			add_location(div4, file$3, 11, 4, 229);
    			attr_dev(div5, "class", "project-name svelte-1lcfozi");
    			add_location(div5, file$3, 16, 12, 390);
    			attr_dev(div6, "class", "project-file svelte-1lcfozi");
    			add_location(div6, file$3, 17, 12, 448);
    			add_location(div7, file$3, 15, 8, 372);
    			attr_dev(div8, "class", "centered svelte-1lcfozi");
    			add_location(div8, file$3, 14, 4, 341);
    			attr_dev(div9, "class", "tile svelte-1lcfozi");
    			add_location(div9, file$3, 5, 0, 108);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div9, anchor);
    			append_dev(div9, div3);
    			append_dev(div3, div0);
    			append_dev(div3, t0);
    			append_dev(div3, div1);
    			append_dev(div3, t1);
    			append_dev(div3, div2);
    			append_dev(div9, t2);
    			append_dev(div9, div4);
    			append_dev(div4, img);
    			append_dev(div9, t3);
    			append_dev(div9, div8);
    			append_dev(div8, div7);
    			append_dev(div7, div5);
    			append_dev(div5, t4);
    			append_dev(div7, t5);
    			append_dev(div7, div6);
    			append_dev(div6, t6);
    			append_dev(div6, t7);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*projectName*/ 1) set_data_dev(t4, /*projectName*/ ctx[0]);
    			if (dirty & /*projectName*/ 1 && t6_value !== (t6_value = /*projectName*/ ctx[0].toLowerCase().replace(" ", "_").replace("-", "_") + "")) set_data_dev(t6, t6_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div9);
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

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ProjectTile', slots, []);
    	let { projectName } = $$props;
    	let { projectDescription } = $$props;
    	let { projectTags } = $$props;

    	$$self.$$.on_mount.push(function () {
    		if (projectName === undefined && !('projectName' in $$props || $$self.$$.bound[$$self.$$.props['projectName']])) {
    			console.warn("<ProjectTile> was created without expected prop 'projectName'");
    		}

    		if (projectDescription === undefined && !('projectDescription' in $$props || $$self.$$.bound[$$self.$$.props['projectDescription']])) {
    			console.warn("<ProjectTile> was created without expected prop 'projectDescription'");
    		}

    		if (projectTags === undefined && !('projectTags' in $$props || $$self.$$.bound[$$self.$$.props['projectTags']])) {
    			console.warn("<ProjectTile> was created without expected prop 'projectTags'");
    		}
    	});

    	const writable_props = ['projectName', 'projectDescription', 'projectTags'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ProjectTile> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('projectName' in $$props) $$invalidate(0, projectName = $$props.projectName);
    		if ('projectDescription' in $$props) $$invalidate(1, projectDescription = $$props.projectDescription);
    		if ('projectTags' in $$props) $$invalidate(2, projectTags = $$props.projectTags);
    	};

    	$$self.$capture_state = () => ({
    		projectName,
    		projectDescription,
    		projectTags
    	});

    	$$self.$inject_state = $$props => {
    		if ('projectName' in $$props) $$invalidate(0, projectName = $$props.projectName);
    		if ('projectDescription' in $$props) $$invalidate(1, projectDescription = $$props.projectDescription);
    		if ('projectTags' in $$props) $$invalidate(2, projectTags = $$props.projectTags);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [projectName, projectDescription, projectTags];
    }

    class ProjectTile extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {
    			projectName: 0,
    			projectDescription: 1,
    			projectTags: 2
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ProjectTile",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get projectName() {
    		throw new Error("<ProjectTile>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set projectName(value) {
    		throw new Error("<ProjectTile>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get projectDescription() {
    		throw new Error("<ProjectTile>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set projectDescription(value) {
    		throw new Error("<ProjectTile>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get projectTags() {
    		throw new Error("<ProjectTile>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set projectTags(value) {
    		throw new Error("<ProjectTile>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/FileExplorer.svelte generated by Svelte v3.55.1 */
    const file$2 = "src/components/FileExplorer.svelte";

    function create_fragment$2(ctx) {
    	let div1;
    	let span;
    	let t1;
    	let div0;
    	let projecttile0;
    	let t2;
    	let projecttile1;
    	let t3;
    	let projecttile2;
    	let t4;
    	let projecttile3;
    	let current;

    	projecttile0 = new ProjectTile({
    			props: {
    				projectName: "NeX",
    				projectDescription: "A custom-built markup language designed for efficient note-taking and drafting math and computer science-related documents.",
    				projectTags: []
    			},
    			$$inline: true
    		});

    	projecttile1 = new ProjectTile({
    			props: {
    				projectName: "CoVariant",
    				projectDescription: "Machine learning project for determining the impact of various demographic factors in the outcome of COVID-19.",
    				projectTags: []
    			},
    			$$inline: true
    		});

    	projecttile2 = new ProjectTile({
    			props: {
    				projectName: "Oui-Eat",
    				projectDescription: "A combined social media app and crowd-sourced review platform for restaurants and other food businesses.",
    				projectTags: []
    			},
    			$$inline: true
    		});

    	projecttile3 = new ProjectTile({
    			props: {
    				projectName: "NeX",
    				projectDescription: "A custom-built markup language designed for efficient note-taking and drafting math and computer science-related documents.",
    				projectTags: []
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			span = element("span");
    			span.textContent = "Projects";
    			t1 = space();
    			div0 = element("div");
    			create_component(projecttile0.$$.fragment);
    			t2 = space();
    			create_component(projecttile1.$$.fragment);
    			t3 = space();
    			create_component(projecttile2.$$.fragment);
    			t4 = space();
    			create_component(projecttile3.$$.fragment);
    			attr_dev(span, "class", "section-header svelte-9v550q");
    			add_location(span, file$2, 5, 4, 95);
    			attr_dev(div0, "class", "tile-view svelte-9v550q");
    			add_location(div0, file$2, 6, 4, 144);
    			attr_dev(div1, "class", "main svelte-9v550q");
    			add_location(div1, file$2, 4, 0, 72);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, span);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			mount_component(projecttile0, div0, null);
    			append_dev(div0, t2);
    			mount_component(projecttile1, div0, null);
    			append_dev(div0, t3);
    			mount_component(projecttile2, div0, null);
    			append_dev(div0, t4);
    			mount_component(projecttile3, div0, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(projecttile0.$$.fragment, local);
    			transition_in(projecttile1.$$.fragment, local);
    			transition_in(projecttile2.$$.fragment, local);
    			transition_in(projecttile3.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(projecttile0.$$.fragment, local);
    			transition_out(projecttile1.$$.fragment, local);
    			transition_out(projecttile2.$$.fragment, local);
    			transition_out(projecttile3.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_component(projecttile0);
    			destroy_component(projecttile1);
    			destroy_component(projecttile2);
    			destroy_component(projecttile3);
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
    	validate_slots('FileExplorer', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<FileExplorer> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ ProjectTile });
    	return [];
    }

    class FileExplorer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "FileExplorer",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const largestZIndex = writable(0);

    /* src/components/Window.svelte generated by Svelte v3.55.1 */
    const file$1 = "src/components/Window.svelte";

    function create_fragment$1(ctx) {
    	let div7;
    	let div5;
    	let div3;
    	let div0;
    	let t0;
    	let div1;
    	let t1;
    	let div2;
    	let t2;
    	let div4;
    	let t3;
    	let t4;
    	let div6;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[13].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[12], null);

    	const block = {
    		c: function create() {
    			div7 = element("div");
    			div5 = element("div");
    			div3 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div1 = element("div");
    			t1 = space();
    			div2 = element("div");
    			t2 = space();
    			div4 = element("div");
    			t3 = text(/*state_title*/ ctx[7]);
    			t4 = space();
    			div6 = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div0, "class", "button close svelte-djpqac");
    			add_location(div0, file$1, 103, 12, 3147);
    			attr_dev(div1, "class", "button minimize svelte-djpqac");
    			add_location(div1, file$1, 109, 12, 3313);
    			attr_dev(div2, "class", "button maximize svelte-djpqac");
    			add_location(div2, file$1, 111, 12, 3426);
    			attr_dev(div3, "class", "buttons svelte-djpqac");
    			add_location(div3, file$1, 101, 8, 3044);
    			attr_dev(div4, "class", "title svelte-djpqac");
    			add_location(div4, file$1, 125, 8, 4025);
    			attr_dev(div5, "class", "header svelte-djpqac");
    			add_location(div5, file$1, 85, 4, 2601);
    			attr_dev(div6, "class", "window-container svelte-djpqac");
    			add_location(div6, file$1, 129, 4, 4101);
    			attr_dev(div7, "class", "window svelte-djpqac");
    			set_style(div7, "top", /*state_top*/ ctx[4] + "px");
    			set_style(div7, "left", /*state_left*/ ctx[5] + "px");
    			set_style(div7, "width", /*state_width*/ ctx[2] + "px");

    			set_style(div7, "height", /*state_height*/ ctx[3] !== null
    			? /*state_height*/ ctx[3] + "px"
    			: "auto");

    			set_style(div7, "display", /*state_visible*/ ctx[6] ? "visible" : "none");
    			set_style(div7, "z-index", /*state_z_index*/ ctx[8]);
    			add_location(div7, file$1, 76, 0, 2305);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div7, anchor);
    			append_dev(div7, div5);
    			append_dev(div5, div3);
    			append_dev(div3, div0);
    			append_dev(div3, t0);
    			append_dev(div3, div1);
    			append_dev(div3, t1);
    			append_dev(div3, div2);
    			append_dev(div5, t2);
    			append_dev(div5, div4);
    			append_dev(div4, t3);
    			append_dev(div7, t4);
    			append_dev(div7, div6);

    			if (default_slot) {
    				default_slot.m(div6, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(div0, "click", /*click_handler*/ ctx[14], false, false, false),
    					listen_dev(div2, "click", /*click_handler_1*/ ctx[15], false, false, false),
    					listen_dev(div5, "mousedown", /*mousedown_handler*/ ctx[16], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*state_title*/ 128) set_data_dev(t3, /*state_title*/ ctx[7]);

    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 4096)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[12],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[12])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[12], dirty, null),
    						null
    					);
    				}
    			}

    			if (dirty & /*state_top*/ 16) {
    				set_style(div7, "top", /*state_top*/ ctx[4] + "px");
    			}

    			if (dirty & /*state_left*/ 32) {
    				set_style(div7, "left", /*state_left*/ ctx[5] + "px");
    			}

    			if (dirty & /*state_width*/ 4) {
    				set_style(div7, "width", /*state_width*/ ctx[2] + "px");
    			}

    			if (dirty & /*state_height*/ 8) {
    				set_style(div7, "height", /*state_height*/ ctx[3] !== null
    				? /*state_height*/ ctx[3] + "px"
    				: "auto");
    			}

    			if (dirty & /*state_visible*/ 64) {
    				set_style(div7, "display", /*state_visible*/ ctx[6] ? "visible" : "none");
    			}

    			if (dirty & /*state_z_index*/ 256) {
    				set_style(div7, "z-index", /*state_z_index*/ ctx[8]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div7);
    			if (default_slot) default_slot.d(detaching);
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

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Window', slots, ['default']);
    	var _a, _b, _c, _d, _e;

    	class WindowInterface {
    		setWindowSize(width, height) {
    			$$invalidate(2, state_width = width);
    			$$invalidate(3, state_height = height);
    		}

    		hide() {
    			$$invalidate(6, state_visible = false);
    		}

    		show() {
    			$$invalidate(6, state_visible = true);
    		}

    		setPosition(x, y) {
    			$$invalidate(4, state_top = y);
    			$$invalidate(5, state_left = x);

    			// clip window position to screen
    			if (state_top < 0) $$invalidate(4, state_top = 0);

    			if (state_left < 0) $$invalidate(5, state_left = 0);
    			if (state_top + state_height > window.innerHeight) $$invalidate(4, state_top = window.innerHeight - state_height);
    			if (state_left + state_width > window.innerWidth) $$invalidate(5, state_left = window.innerWidth - state_width);
    		}

    		setTitle(to) {
    			$$invalidate(7, state_title = to);
    		}

    		focus() {
    			largestZIndex.update(z => z + 1);
    			$$invalidate(8, state_z_index = get_store_value(largestZIndex));
    		}
    	}

    	let { config } = $$props;
    	let state_width;
    	let state_height;
    	let state_top;
    	let state_left;

    	let state_visible = (_a = config.visible) !== null && _a !== void 0
    	? _a
    	: true;

    	let state_title = (_b = config.title) !== null && _b !== void 0 ? _b : "";
    	let state_z_index = 0;
    	let state_maximized = false;
    	let drag = { offsetX: 0, offsetY: 0, dragging: false };
    	const windowInterface = new WindowInterface();

    	function dragManager(event) {
    		if (drag.dragging) {
    			windowInterface.setPosition(event.clientX - drag.offsetX, event.clientY - drag.offsetY);
    		}
    	}

    	onMount(() => {
    		window.addEventListener("mousemove", dragManager);
    	});

    	onDestroy(() => {
    		window.removeEventListener("mousemove", dragManager);
    	});

    	let left = (_c = config.left) !== null && _c !== void 0 ? _c : 0;
    	let top = (_d = config.top) !== null && _d !== void 0 ? _d : 0;

    	if (config.right !== undefined) {
    		left = window.innerWidth - config.right - config.width;
    	}

    	if (config.bottom !== undefined) {
    		top = window.innerHeight - config.bottom - ((_e = config.height) !== null && _e !== void 0
    		? _e
    		: config.width);
    	}

    	windowInterface.setPosition(left, top);
    	windowInterface.setWindowSize(config.width, config.height);
    	windowInterface.setTitle(state_title);
    	windowInterface.show();

    	$$self.$$.on_mount.push(function () {
    		if (config === undefined && !('config' in $$props || $$self.$$.bound[$$self.$$.props['config']])) {
    			console.warn("<Window> was created without expected prop 'config'");
    		}
    	});

    	const writable_props = ['config'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Window> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		windowInterface.hide();
    	};

    	const click_handler_1 = () => {
    		$$invalidate(9, state_maximized = !state_maximized);

    		if (state_maximized) {
    			windowInterface.setWindowSize(window.innerWidth, window.innerHeight);
    			windowInterface.setPosition(0, 0);
    		} else {
    			windowInterface.setWindowSize(config.width, config.height);
    			windowInterface.setPosition(state_left, state_top);
    		}
    	};

    	const mousedown_handler = ev => {
    		$$invalidate(10, drag.dragging = true, drag);
    		$$invalidate(10, drag.offsetX = ev.offsetX, drag);
    		$$invalidate(10, drag.offsetY = ev.offsetY, drag);

    		function release() {
    			$$invalidate(10, drag.dragging = false, drag);
    			window.removeEventListener("mouseup", release);
    		}

    		window.addEventListener("mouseup", release);
    		windowInterface.focus();
    	};

    	$$self.$$set = $$props => {
    		if ('config' in $$props) $$invalidate(0, config = $$props.config);
    		if ('$$scope' in $$props) $$invalidate(12, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		_a,
    		_b,
    		_c,
    		_d,
    		_e,
    		onDestroy,
    		onMount,
    		get: get_store_value,
    		largestZIndex,
    		WindowInterface,
    		config,
    		state_width,
    		state_height,
    		state_top,
    		state_left,
    		state_visible,
    		state_title,
    		state_z_index,
    		state_maximized,
    		drag,
    		windowInterface,
    		dragManager,
    		left,
    		top
    	});

    	$$self.$inject_state = $$props => {
    		if ('_a' in $$props) _a = $$props._a;
    		if ('_b' in $$props) _b = $$props._b;
    		if ('_c' in $$props) _c = $$props._c;
    		if ('_d' in $$props) _d = $$props._d;
    		if ('_e' in $$props) _e = $$props._e;
    		if ('config' in $$props) $$invalidate(0, config = $$props.config);
    		if ('state_width' in $$props) $$invalidate(2, state_width = $$props.state_width);
    		if ('state_height' in $$props) $$invalidate(3, state_height = $$props.state_height);
    		if ('state_top' in $$props) $$invalidate(4, state_top = $$props.state_top);
    		if ('state_left' in $$props) $$invalidate(5, state_left = $$props.state_left);
    		if ('state_visible' in $$props) $$invalidate(6, state_visible = $$props.state_visible);
    		if ('state_title' in $$props) $$invalidate(7, state_title = $$props.state_title);
    		if ('state_z_index' in $$props) $$invalidate(8, state_z_index = $$props.state_z_index);
    		if ('state_maximized' in $$props) $$invalidate(9, state_maximized = $$props.state_maximized);
    		if ('drag' in $$props) $$invalidate(10, drag = $$props.drag);
    		if ('left' in $$props) left = $$props.left;
    		if ('top' in $$props) top = $$props.top;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		config,
    		windowInterface,
    		state_width,
    		state_height,
    		state_top,
    		state_left,
    		state_visible,
    		state_title,
    		state_z_index,
    		state_maximized,
    		drag,
    		WindowInterface,
    		$$scope,
    		slots,
    		click_handler,
    		click_handler_1,
    		mousedown_handler
    	];
    }

    class Window extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			WindowInterface: 11,
    			config: 0,
    			windowInterface: 1
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Window",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get WindowInterface() {
    		return this.$$.ctx[11];
    	}

    	set WindowInterface(value) {
    		throw new Error("<Window>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get config() {
    		throw new Error("<Window>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set config(value) {
    		throw new Error("<Window>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get windowInterface() {
    		return this.$$.ctx[1];
    	}

    	set windowInterface(value) {
    		throw new Error("<Window>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.55.1 */

    const { Object: Object_1 } = globals;
    const file = "src/App.svelte";

    // (30:8) <DefaultStyledWindowContainer>
    function create_default_slot_4(ctx) {
    	let div3;
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let div2;
    	let span;
    	let t2;
    	let div1;
    	let p0;
    	let t4;
    	let p1;

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			div2 = element("div");
    			span = element("span");
    			span.textContent = "Ian Huang";
    			t2 = space();
    			div1 = element("div");
    			p0 = element("p");
    			p0.textContent = "Hi, I'm a software developer and student at the University of Toronto\n                            with specific interests in web development, systems programming, and\n                            machine learning.";
    			t4 = space();
    			p1 = element("p");
    			p1.textContent = "You can learn more about my work using the window on the right or by\n                            exploring the projects highlighted on my Github. You can also interact\n                            with many of the items on this page.";
    			attr_dev(img, "class", "pfp svelte-4a06y9");
    			if (!src_url_equal(img.src, img_src_value = "/images/pfp.jpeg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Profile");
    			add_location(img, file, 32, 20, 1374);
    			add_location(div0, file, 31, 16, 1348);
    			attr_dev(span, "class", "title");
    			set_style(span, "font-size", "24pt");
    			add_location(span, file, 35, 20, 1542);
    			add_location(p0, file, 37, 24, 1654);
    			add_location(p1, file, 42, 24, 1952);
    			add_location(div1, file, 36, 20, 1624);
    			set_style(div2, "margin-left", "30px");
    			set_style(div2, "margin-right", "10px");
    			add_location(div2, file, 34, 16, 1470);
    			attr_dev(div3, "class", "biography-container svelte-4a06y9");
    			add_location(div3, file, 30, 12, 1298);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div0);
    			append_dev(div0, img);
    			append_dev(div3, t0);
    			append_dev(div3, div2);
    			append_dev(div2, span);
    			append_dev(div2, t2);
    			append_dev(div2, div1);
    			append_dev(div1, p0);
    			append_dev(div1, t4);
    			append_dev(div1, p1);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_4.name,
    		type: "slot",
    		source: "(30:8) <DefaultStyledWindowContainer>",
    		ctx
    	});

    	return block;
    }

    // (29:4) <Window config={{...aboutMeDims, title: "About Me"}}>
    function create_default_slot_3(ctx) {
    	let defaultstyledwindowcontainer;
    	let current;

    	defaultstyledwindowcontainer = new DefaultStyledWindowContainer({
    			props: {
    				$$slots: { default: [create_default_slot_4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(defaultstyledwindowcontainer.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(defaultstyledwindowcontainer, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const defaultstyledwindowcontainer_changes = {};

    			if (dirty & /*$$scope*/ 16) {
    				defaultstyledwindowcontainer_changes.$$scope = { dirty, ctx };
    			}

    			defaultstyledwindowcontainer.$set(defaultstyledwindowcontainer_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(defaultstyledwindowcontainer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(defaultstyledwindowcontainer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(defaultstyledwindowcontainer, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(29:4) <Window config={{...aboutMeDims, title: \\\"About Me\\\"}}>",
    		ctx
    	});

    	return block;
    }

    // (61:8) <DefaultStyledWindowContainer>
    function create_default_slot_2(ctx) {
    	let span;
    	let t1;
    	let contactcard0;
    	let t2;
    	let contactcard1;
    	let t3;
    	let contactcard2;
    	let current;

    	contactcard0 = new ContactCard({
    			props: {
    				iconImageURL: "/images/github.png",
    				targetURL: "https://github.com/iahuang",
    				title: "Github",
    				subtitle: "github.com/iahuang"
    			},
    			$$inline: true
    		});

    	contactcard1 = new ContactCard({
    			props: {
    				iconImageURL: "/images/linkedin.png",
    				targetURL: "https://www.linkedin.com/in/ian-a-huang/",
    				title: "LinkedIn",
    				subtitle: "linkedin.com/in/ian-a-huang/"
    			},
    			$$inline: true
    		});

    	contactcard2 = new ContactCard({
    			props: {
    				iconImageURL: "/images/email.png",
    				targetURL: "mailto:ia.huang@mail.utoronto.ca",
    				title: "Email",
    				subtitle: "ia.huang@mail.utoronto.ca"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "Contact";
    			t1 = space();
    			create_component(contactcard0.$$.fragment);
    			t2 = space();
    			create_component(contactcard1.$$.fragment);
    			t3 = space();
    			create_component(contactcard2.$$.fragment);
    			attr_dev(span, "class", "title");
    			add_location(span, file, 61, 12, 2601);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(contactcard0, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(contactcard1, target, anchor);
    			insert_dev(target, t3, anchor);
    			mount_component(contactcard2, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(contactcard0.$$.fragment, local);
    			transition_in(contactcard1.$$.fragment, local);
    			transition_in(contactcard2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(contactcard0.$$.fragment, local);
    			transition_out(contactcard1.$$.fragment, local);
    			transition_out(contactcard2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			if (detaching) detach_dev(t1);
    			destroy_component(contactcard0, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(contactcard1, detaching);
    			if (detaching) detach_dev(t3);
    			destroy_component(contactcard2, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(61:8) <DefaultStyledWindowContainer>",
    		ctx
    	});

    	return block;
    }

    // (53:4) <Window         config={{             ...makeScaledWindowDimensions(0.4, 0.5),             left: 18,             bottom: 20,             title: "Contact Info",         }}     >
    function create_default_slot_1(ctx) {
    	let defaultstyledwindowcontainer;
    	let current;

    	defaultstyledwindowcontainer = new DefaultStyledWindowContainer({
    			props: {
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(defaultstyledwindowcontainer.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(defaultstyledwindowcontainer, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const defaultstyledwindowcontainer_changes = {};

    			if (dirty & /*$$scope*/ 16) {
    				defaultstyledwindowcontainer_changes.$$scope = { dirty, ctx };
    			}

    			defaultstyledwindowcontainer.$set(defaultstyledwindowcontainer_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(defaultstyledwindowcontainer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(defaultstyledwindowcontainer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(defaultstyledwindowcontainer, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(53:4) <Window         config={{             ...makeScaledWindowDimensions(0.4, 0.5),             left: 18,             bottom: 20,             title: \\\"Contact Info\\\",         }}     >",
    		ctx
    	});

    	return block;
    }

    // (83:4) <Window config={{...projectsDims, title: "File Explorer"}}>
    function create_default_slot(ctx) {
    	let fileexplorer;
    	let current;
    	fileexplorer = new FileExplorer({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(fileexplorer.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(fileexplorer, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(fileexplorer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(fileexplorer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(fileexplorer, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(83:4) <Window config={{...projectsDims, title: \\\"File Explorer\\\"}}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let background;
    	let t0;
    	let window0;
    	let t1;
    	let window1;
    	let t2;
    	let window2;
    	let current;
    	background = new Background({ $$inline: true });

    	window0 = new Window({
    			props: {
    				config: {
    					.../*aboutMeDims*/ ctx[0],
    					title: "About Me"
    				},
    				$$slots: { default: [create_default_slot_3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	window1 = new Window({
    			props: {
    				config: {
    					...makeScaledWindowDimensions(0.4, 0.5),
    					left: 18,
    					bottom: 20,
    					title: "Contact Info"
    				},
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	window2 = new Window({
    			props: {
    				config: {
    					.../*projectsDims*/ ctx[1],
    					title: "File Explorer"
    				},
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(background.$$.fragment);
    			t0 = space();
    			create_component(window0.$$.fragment);
    			t1 = space();
    			create_component(window1.$$.fragment);
    			t2 = space();
    			create_component(window2.$$.fragment);
    			attr_dev(main, "class", "svelte-4a06y9");
    			add_location(main, file, 25, 0, 1162);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(background, main, null);
    			append_dev(main, t0);
    			mount_component(window0, main, null);
    			append_dev(main, t1);
    			mount_component(window1, main, null);
    			append_dev(main, t2);
    			mount_component(window2, main, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const window0_changes = {};

    			if (dirty & /*aboutMeDims*/ 1) window0_changes.config = {
    				.../*aboutMeDims*/ ctx[0],
    				title: "About Me"
    			};

    			if (dirty & /*$$scope*/ 16) {
    				window0_changes.$$scope = { dirty, ctx };
    			}

    			window0.$set(window0_changes);
    			const window1_changes = {};

    			if (dirty & /*$$scope*/ 16) {
    				window1_changes.$$scope = { dirty, ctx };
    			}

    			window1.$set(window1_changes);
    			const window2_changes = {};

    			if (dirty & /*projectsDims*/ 2) window2_changes.config = {
    				.../*projectsDims*/ ctx[1],
    				title: "File Explorer"
    			};

    			if (dirty & /*$$scope*/ 16) {
    				window2_changes.$$scope = { dirty, ctx };
    			}

    			window2.$set(window2_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(background.$$.fragment, local);
    			transition_in(window0.$$.fragment, local);
    			transition_in(window1.$$.fragment, local);
    			transition_in(window2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(background.$$.fragment, local);
    			transition_out(window0.$$.fragment, local);
    			transition_out(window1.$$.fragment, local);
    			transition_out(window2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(background);
    			destroy_component(window0);
    			destroy_component(window1);
    			destroy_component(window2);
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

    function makeScaledWindowDimensions(widthScale, aspectRatio) {
    	return {
    		width: window.innerWidth * widthScale,
    		height: aspectRatio !== undefined
    		? window.innerWidth * widthScale * aspectRatio
    		: null
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let aboutMeDims;
    	let projectsDims;
    	let contactDims;
    	const isMobile = window.innerWidth < window.innerHeight;

    	if (isMobile) {
    		aboutMeDims = Object.assign(Object.assign({}, makeScaledWindowDimensions(0.9)), { top: 10, left: 15 });
    		projectsDims = Object.assign(Object.assign({}, makeScaledWindowDimensions(0.9, 0.6)), { left: 17, bottom: 10 });
    	} else {
    		aboutMeDims = Object.assign(Object.assign({}, makeScaledWindowDimensions(0.45)), { top: 10, left: 15 });
    		projectsDims = Object.assign(Object.assign({}, makeScaledWindowDimensions(0.5, 0.8)), { top: 10, right: 10 });
    	}

    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Background,
    		ContactCard,
    		DefaultStyledWindowContainer,
    		FileExplorer,
    		Window,
    		makeScaledWindowDimensions,
    		aboutMeDims,
    		projectsDims,
    		contactDims,
    		isMobile
    	});

    	$$self.$inject_state = $$props => {
    		if ('aboutMeDims' in $$props) $$invalidate(0, aboutMeDims = $$props.aboutMeDims);
    		if ('projectsDims' in $$props) $$invalidate(1, projectsDims = $$props.projectsDims);
    		if ('contactDims' in $$props) contactDims = $$props.contactDims;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [aboutMeDims, projectsDims];
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
        target: document.body,
        props: {},
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
