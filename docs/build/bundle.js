
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
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
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
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
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
    function null_to_empty(value) {
        return value == null ? '' : value;
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
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
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
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
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
    			attr_dev(div, "class", "container svelte-q4nibd");
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

    /* src/components/FileList.svelte generated by Svelte v3.55.1 */

    const file$3 = "src/components/FileList.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	return child_ctx;
    }

    // (56:20) {#each file.tags as tag}
    function create_each_block_1(ctx) {
    	let span;
    	let t_value = /*tag*/ ctx[9] + "";
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			attr_dev(span, "class", "tag svelte-188jmbk");
    			set_style(span, "background-color", /*tagColors*/ ctx[0][/*tag*/ ctx[9].toLowerCase()] ?? /*tagColorDefault*/ ctx[1]);
    			add_location(span, file$3, 56, 24, 1654);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*files*/ 4 && t_value !== (t_value = /*tag*/ ctx[9] + "")) set_data_dev(t, t_value);

    			if (dirty & /*tagColors, files, tagColorDefault*/ 7) {
    				set_style(span, "background-color", /*tagColors*/ ctx[0][/*tag*/ ctx[9].toLowerCase()] ?? /*tagColorDefault*/ ctx[1]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(56:20) {#each file.tags as tag}",
    		ctx
    	});

    	return block;
    }

    // (34:4) {#each files as file}
    function create_each_block(ctx) {
    	let tr;
    	let td0;
    	let span0;
    	let t0_value = (/*file*/ ctx[6].isFolder ? "folder_open" : "description") + "";
    	let t0;
    	let t1;
    	let td1;
    	let div0;
    	let span1;
    	let t2_value = /*file*/ ctx[6].displayName + "";
    	let t2;
    	let t3;
    	let span2;
    	let t4_value = /*file*/ ctx[6].fileName + "";
    	let t4;
    	let t5;
    	let td2;
    	let t6_value = /*file*/ ctx[6].year + "";
    	let t6;
    	let t7;
    	let td3;
    	let div1;
    	let span3;
    	let t8_value = /*file*/ ctx[6].description + "";
    	let t8;
    	let t9;
    	let td4;
    	let div2;
    	let t10;
    	let mounted;
    	let dispose;
    	let each_value_1 = /*file*/ ctx[6].tags;
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	function click_handler() {
    		return /*click_handler*/ ctx[4](/*file*/ ctx[6]);
    	}

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			span0 = element("span");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			div0 = element("div");
    			span1 = element("span");
    			t2 = text(t2_value);
    			t3 = space();
    			span2 = element("span");
    			t4 = text(t4_value);
    			t5 = space();
    			td2 = element("td");
    			t6 = text(t6_value);
    			t7 = space();
    			td3 = element("td");
    			div1 = element("div");
    			span3 = element("span");
    			t8 = text(t8_value);
    			t9 = space();
    			td4 = element("td");
    			div2 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t10 = space();
    			attr_dev(span0, "class", "material-symbols-outlined svelte-188jmbk");
    			add_location(span0, file$3, 40, 29, 918);
    			attr_dev(td0, "class", "icon svelte-188jmbk");
    			add_location(td0, file$3, 40, 12, 901);
    			attr_dev(span1, "class", "file-display-name svelte-188jmbk");
    			set_style(span1, "font-size", fontSizeFromName(/*file*/ ctx[6].displayName));
    			add_location(span1, file$3, 43, 20, 1095);
    			attr_dev(span2, "class", "file-name svelte-188jmbk");
    			add_location(span2, file$3, 44, 20, 1226);
    			attr_dev(div0, "class", "file-info svelte-188jmbk");
    			add_location(div0, file$3, 42, 16, 1051);
    			attr_dev(td1, "class", "svelte-188jmbk");
    			add_location(td1, file$3, 41, 12, 1030);
    			attr_dev(td2, "class", "svelte-188jmbk");
    			add_location(td2, file$3, 47, 12, 1326);
    			attr_dev(span3, "class", "desc-text svelte-188jmbk");
    			add_location(span3, file$3, 50, 20, 1442);
    			attr_dev(div1, "class", "vcenter svelte-188jmbk");
    			add_location(div1, file$3, 49, 16, 1400);
    			attr_dev(td3, "class", "description svelte-188jmbk");
    			add_location(td3, file$3, 48, 12, 1359);
    			attr_dev(div2, "class", "tags");
    			add_location(div2, file$3, 54, 16, 1566);
    			attr_dev(td4, "class", "svelte-188jmbk");
    			add_location(td4, file$3, 53, 12, 1545);
    			attr_dev(tr, "class", "file-row svelte-188jmbk");
    			add_location(tr, file$3, 34, 8, 770);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, span0);
    			append_dev(span0, t0);
    			append_dev(tr, t1);
    			append_dev(tr, td1);
    			append_dev(td1, div0);
    			append_dev(div0, span1);
    			append_dev(span1, t2);
    			append_dev(div0, t3);
    			append_dev(div0, span2);
    			append_dev(span2, t4);
    			append_dev(tr, t5);
    			append_dev(tr, td2);
    			append_dev(td2, t6);
    			append_dev(tr, t7);
    			append_dev(tr, td3);
    			append_dev(td3, div1);
    			append_dev(div1, span3);
    			append_dev(span3, t8);
    			append_dev(tr, t9);
    			append_dev(tr, td4);
    			append_dev(td4, div2);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div2, null);
    			}

    			append_dev(tr, t10);

    			if (!mounted) {
    				dispose = listen_dev(tr, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*files*/ 4 && t0_value !== (t0_value = (/*file*/ ctx[6].isFolder ? "folder_open" : "description") + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*files*/ 4 && t2_value !== (t2_value = /*file*/ ctx[6].displayName + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*files*/ 4) {
    				set_style(span1, "font-size", fontSizeFromName(/*file*/ ctx[6].displayName));
    			}

    			if (dirty & /*files*/ 4 && t4_value !== (t4_value = /*file*/ ctx[6].fileName + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*files*/ 4 && t6_value !== (t6_value = /*file*/ ctx[6].year + "")) set_data_dev(t6, t6_value);
    			if (dirty & /*files*/ 4 && t8_value !== (t8_value = /*file*/ ctx[6].description + "")) set_data_dev(t8, t8_value);

    			if (dirty & /*tagColors, files, tagColorDefault*/ 7) {
    				each_value_1 = /*file*/ ctx[6].tags;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div2, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(34:4) {#each files as file}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let table;
    	let tr0;
    	let th0;
    	let t0;
    	let th1;
    	let t2;
    	let th2;
    	let t4;
    	let th3;
    	let t6;
    	let th4;
    	let t8;
    	let tr1;
    	let t9;
    	let each_value = /*files*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			table = element("table");
    			tr0 = element("tr");
    			th0 = element("th");
    			t0 = space();
    			th1 = element("th");
    			th1.textContent = "Name";
    			t2 = space();
    			th2 = element("th");
    			th2.textContent = "Year";
    			t4 = space();
    			th3 = element("th");
    			th3.textContent = "Description";
    			t6 = space();
    			th4 = element("th");
    			th4.textContent = "Tags";
    			t8 = space();
    			tr1 = element("tr");
    			t9 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			set_style(th0, "width", "5%");
    			attr_dev(th0, "class", "svelte-188jmbk");
    			add_location(th0, file$3, 26, 8, 524);
    			set_style(th1, "width", "15%");
    			attr_dev(th1, "class", "svelte-188jmbk");
    			add_location(th1, file$3, 27, 8, 557);
    			set_style(th2, "width", "6%");
    			attr_dev(th2, "class", "svelte-188jmbk");
    			add_location(th2, file$3, 28, 8, 598);
    			set_style(th3, "width", "45%");
    			attr_dev(th3, "class", "svelte-188jmbk");
    			add_location(th3, file$3, 29, 8, 638);
    			attr_dev(th4, "class", "svelte-188jmbk");
    			add_location(th4, file$3, 30, 8, 686);
    			add_location(tr0, file$3, 25, 4, 511);
    			attr_dev(tr1, "class", "spacer svelte-188jmbk");
    			add_location(tr1, file$3, 32, 4, 714);
    			attr_dev(table, "class", "svelte-188jmbk");
    			add_location(table, file$3, 24, 0, 499);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, table, anchor);
    			append_dev(table, tr0);
    			append_dev(tr0, th0);
    			append_dev(tr0, t0);
    			append_dev(tr0, th1);
    			append_dev(tr0, t2);
    			append_dev(tr0, th2);
    			append_dev(tr0, t4);
    			append_dev(tr0, th3);
    			append_dev(tr0, t6);
    			append_dev(tr0, th4);
    			append_dev(table, t8);
    			append_dev(table, tr1);
    			append_dev(table, t9);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(table, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*onClick, files, tagColors, tagColorDefault, fontSizeFromName*/ 15) {
    				each_value = /*files*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(table, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(table);
    			destroy_each(each_blocks, detaching);
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

    function fontSizeFromName(name) {
    	if (name.length <= 20) {
    		return "11pt";
    	} else if (name.length <= 30) {
    		return "9pt";
    	} else if (name.length <= 40) {
    		return "7pt";
    	} else {
    		return "6pt";
    	}
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('FileList', slots, []);
    	let { tagColors } = $$props;
    	let { tagColorDefault } = $$props;
    	let { files } = $$props;
    	let { onClick } = $$props;

    	function getTagColor(tag) {
    		var _a;

    		return (_a = tagColors[tag]) !== null && _a !== void 0
    		? _a
    		: tagColorDefault;
    	}

    	$$self.$$.on_mount.push(function () {
    		if (tagColors === undefined && !('tagColors' in $$props || $$self.$$.bound[$$self.$$.props['tagColors']])) {
    			console.warn("<FileList> was created without expected prop 'tagColors'");
    		}

    		if (tagColorDefault === undefined && !('tagColorDefault' in $$props || $$self.$$.bound[$$self.$$.props['tagColorDefault']])) {
    			console.warn("<FileList> was created without expected prop 'tagColorDefault'");
    		}

    		if (files === undefined && !('files' in $$props || $$self.$$.bound[$$self.$$.props['files']])) {
    			console.warn("<FileList> was created without expected prop 'files'");
    		}

    		if (onClick === undefined && !('onClick' in $$props || $$self.$$.bound[$$self.$$.props['onClick']])) {
    			console.warn("<FileList> was created without expected prop 'onClick'");
    		}
    	});

    	const writable_props = ['tagColors', 'tagColorDefault', 'files', 'onClick'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<FileList> was created with unknown prop '${key}'`);
    	});

    	const click_handler = file => {
    		onClick(file);
    	};

    	$$self.$$set = $$props => {
    		if ('tagColors' in $$props) $$invalidate(0, tagColors = $$props.tagColors);
    		if ('tagColorDefault' in $$props) $$invalidate(1, tagColorDefault = $$props.tagColorDefault);
    		if ('files' in $$props) $$invalidate(2, files = $$props.files);
    		if ('onClick' in $$props) $$invalidate(3, onClick = $$props.onClick);
    	};

    	$$self.$capture_state = () => ({
    		tagColors,
    		tagColorDefault,
    		files,
    		onClick,
    		getTagColor,
    		fontSizeFromName
    	});

    	$$self.$inject_state = $$props => {
    		if ('tagColors' in $$props) $$invalidate(0, tagColors = $$props.tagColors);
    		if ('tagColorDefault' in $$props) $$invalidate(1, tagColorDefault = $$props.tagColorDefault);
    		if ('files' in $$props) $$invalidate(2, files = $$props.files);
    		if ('onClick' in $$props) $$invalidate(3, onClick = $$props.onClick);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [tagColors, tagColorDefault, files, onClick, click_handler];
    }

    class FileList extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {
    			tagColors: 0,
    			tagColorDefault: 1,
    			files: 2,
    			onClick: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "FileList",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get tagColors() {
    		throw new Error("<FileList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tagColors(value) {
    		throw new Error("<FileList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get tagColorDefault() {
    		throw new Error("<FileList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tagColorDefault(value) {
    		throw new Error("<FileList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get files() {
    		throw new Error("<FileList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set files(value) {
    		throw new Error("<FileList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get onClick() {
    		throw new Error("<FileList>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onClick(value) {
    		throw new Error("<FileList>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/FileExplorer.svelte generated by Svelte v3.55.1 */
    const file$2 = "src/components/FileExplorer.svelte";

    function create_fragment$2(ctx) {
    	let div1;
    	let span;
    	let t1;
    	let hr;
    	let t2;
    	let filelist;
    	let t3;
    	let div0;
    	let current;

    	filelist = new FileList({
    			props: {
    				files: /*projects*/ ctx[1].map(/*func*/ ctx[2]),
    				tagColors: /*tagColors*/ ctx[0],
    				tagColorDefault,
    				onClick: /*func_1*/ ctx[3]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			span = element("span");
    			span.textContent = "projects/";
    			t1 = space();
    			hr = element("hr");
    			t2 = space();
    			create_component(filelist.$$.fragment);
    			t3 = space();
    			div0 = element("div");
    			attr_dev(span, "class", "section-header svelte-1hrc4ak");
    			add_location(span, file$2, 79, 4, 2547);
    			attr_dev(hr, "class", "svelte-1hrc4ak");
    			add_location(hr, file$2, 80, 4, 2597);
    			set_style(div0, "height", "20px");
    			add_location(div0, file$2, 91, 4, 2945);
    			attr_dev(div1, "class", "main svelte-1hrc4ak");
    			add_location(div1, file$2, 78, 0, 2524);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, span);
    			append_dev(div1, t1);
    			append_dev(div1, hr);
    			append_dev(div1, t2);
    			mount_component(filelist, div1, null);
    			append_dev(div1, t3);
    			append_dev(div1, div0);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(filelist.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(filelist.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_component(filelist);
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

    const tagColorDefault = "#a6a6a6";

    function projectInfoToFileInfo(project) {
    	return {
    		displayName: project.name,
    		fileName: project.name.toLowerCase().replace(" ", "_").replace("-", "_") + ".proj",
    		isFolder: true,
    		tags: project.tags,
    		year: project.year,
    		description: project.description
    	};
    }

    function blogInfoToFileInfo(blog) {
    	let d = blog.publishDate;

    	return {
    		displayName: blog.name,
    		fileName: `${d.getFullYear()}_${d.getMonth() + 1}_${d.getDate()}.docx`,
    		isFolder: false,
    		tags: blog.tags,
    		year: blog.publishDate.getFullYear(),
    		description: blog.description
    	};
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('FileExplorer', slots, []);

    	const tagColors = {
    		typescript: "#2F73BF",
    		python: "#f8ae26",
    		azure: "#0285D0",
    		node: "#7EC728",
    		java: "#E01F22",
    		"html/css": "#E36028",
    		mongodb: "#04AB4E"
    	};

    	let projects = [
    		{
    			name: "Oui-Eat",
    			tags: ["React Native", "Java", "MongoDB", "Azure"],
    			year: 2022,
    			description: "A combined social media app and crowd-sourced review platform for restaurants and other food businesses.",
    			link: "https://github.com/iahuang/oui-eat"
    		},
    		{
    			name: "NeX",
    			tags: ["Node", "Typescript"],
    			year: 2022,
    			description: "A custom-built markup language designed for efficient note-taking and drafting math and computer science-related documents.",
    			link: "https://github.com/nex-project/nex"
    		},
    		{
    			name: "CoVariant",
    			tags: ["Python", "Deep Learning"],
    			year: 2021,
    			description: "Machine learning project for determining the impact of various demographic factors in the outcome of COVID-19.",
    			link: "https://github.com/iahuang/covariant"
    		},
    		{
    			name: "Theta",
    			tags: ["Python", "Algorithm Analyis"],
    			year: 2021,
    			description: "A multi-variable time complexity analysis library written in Python",
    			link: "https://github.com/iahuang/theta"
    		},
    		{
    			name: "Taro",
    			tags: ["Typescript", "HTML/CSS"],
    			year: 2020,
    			description: "A modern web framework inspired by Svelte and ReactJS.",
    			link: "https://github.com/iahuang/taro"
    		},
    		{
    			name: "JAtari",
    			tags: ["Java"],
    			description: "A work-in-progress Atari 2600 emulator written in Java.",
    			year: 2018,
    			link: "https://github.com/iahuang/JAtari"
    		}
    	];

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<FileExplorer> was created with unknown prop '${key}'`);
    	});

    	const func = p => projectInfoToFileInfo(p);

    	const func_1 = file => {
    		// find corresponding project
    		let project = projects.find(p => p.name === file.displayName);

    		window.location.href = project.link;
    	};

    	$$self.$capture_state = () => ({
    		FileList,
    		tagColors,
    		tagColorDefault,
    		projectInfoToFileInfo,
    		blogInfoToFileInfo,
    		projects
    	});

    	$$self.$inject_state = $$props => {
    		if ('projects' in $$props) $$invalidate(1, projects = $$props.projects);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [tagColors, projects, func, func_1];
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
    	let div0_class_value;
    	let t0;
    	let div1;
    	let div1_class_value;
    	let t1;
    	let div2;
    	let div2_class_value;
    	let t2;
    	let div4;
    	let t3;
    	let t4;
    	let div6;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[16].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[15], null);

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
    			t3 = text(/*state_title*/ ctx[8]);
    			t4 = space();
    			div6 = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div0, "class", div0_class_value = "" + (null_to_empty(/*buttonClass*/ ctx[11] + " close") + " svelte-1xbyi43"));
    			add_location(div0, file$1, 110, 12, 3436);
    			attr_dev(div1, "class", div1_class_value = "" + (null_to_empty(/*buttonClass*/ ctx[11] + " minimize") + " svelte-1xbyi43"));
    			add_location(div1, file$1, 116, 12, 3612);
    			attr_dev(div2, "class", div2_class_value = "" + (null_to_empty(/*buttonClass*/ ctx[11] + " maximize") + " svelte-1xbyi43"));
    			add_location(div2, file$1, 118, 12, 3735);
    			attr_dev(div3, "class", "buttons svelte-1xbyi43");
    			add_location(div3, file$1, 108, 8, 3333);
    			attr_dev(div4, "class", "title svelte-1xbyi43");
    			add_location(div4, file$1, 132, 8, 4344);
    			attr_dev(div5, "class", "header svelte-1xbyi43");
    			add_location(div5, file$1, 92, 4, 2890);
    			attr_dev(div6, "class", "window-container svelte-1xbyi43");
    			add_location(div6, file$1, 136, 4, 4420);
    			attr_dev(div7, "class", "window svelte-1xbyi43");
    			set_style(div7, "top", /*state_top*/ ctx[5] + "px");
    			set_style(div7, "left", /*state_left*/ ctx[6] + "px");
    			set_style(div7, "width", /*state_width*/ ctx[3] + "px");

    			set_style(div7, "height", /*state_height*/ ctx[4] !== null
    			? /*state_height*/ ctx[4] + "px"
    			: "auto");

    			set_style(div7, "display", /*state_visible*/ ctx[7] ? "visible" : "none");
    			set_style(div7, "z-index", /*state_z_index*/ ctx[2]);
    			add_location(div7, file$1, 80, 0, 2532);
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
    					listen_dev(div0, "click", /*click_handler*/ ctx[17], false, false, false),
    					listen_dev(div2, "click", /*click_handler_1*/ ctx[18], false, false, false),
    					listen_dev(div5, "mousedown", /*mousedown_handler*/ ctx[19], false, false, false),
    					listen_dev(div7, "click", /*click_handler_2*/ ctx[20], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*buttonClass*/ 2048 && div0_class_value !== (div0_class_value = "" + (null_to_empty(/*buttonClass*/ ctx[11] + " close") + " svelte-1xbyi43"))) {
    				attr_dev(div0, "class", div0_class_value);
    			}

    			if (!current || dirty & /*buttonClass*/ 2048 && div1_class_value !== (div1_class_value = "" + (null_to_empty(/*buttonClass*/ ctx[11] + " minimize") + " svelte-1xbyi43"))) {
    				attr_dev(div1, "class", div1_class_value);
    			}

    			if (!current || dirty & /*buttonClass*/ 2048 && div2_class_value !== (div2_class_value = "" + (null_to_empty(/*buttonClass*/ ctx[11] + " maximize") + " svelte-1xbyi43"))) {
    				attr_dev(div2, "class", div2_class_value);
    			}

    			if (!current || dirty & /*state_title*/ 256) set_data_dev(t3, /*state_title*/ ctx[8]);

    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 32768)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[15],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[15])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[15], dirty, null),
    						null
    					);
    				}
    			}

    			if (dirty & /*state_top*/ 32) {
    				set_style(div7, "top", /*state_top*/ ctx[5] + "px");
    			}

    			if (dirty & /*state_left*/ 64) {
    				set_style(div7, "left", /*state_left*/ ctx[6] + "px");
    			}

    			if (dirty & /*state_width*/ 8) {
    				set_style(div7, "width", /*state_width*/ ctx[3] + "px");
    			}

    			if (dirty & /*state_height*/ 16) {
    				set_style(div7, "height", /*state_height*/ ctx[4] !== null
    				? /*state_height*/ ctx[4] + "px"
    				: "auto");
    			}

    			if (dirty & /*state_visible*/ 128) {
    				set_style(div7, "display", /*state_visible*/ ctx[7] ? "visible" : "none");
    			}

    			if (dirty & /*state_z_index*/ 4) {
    				set_style(div7, "z-index", /*state_z_index*/ ctx[2]);
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
    	let state_focused;
    	let buttonClass;
    	let $largestZIndex;
    	validate_store(largestZIndex, 'largestZIndex');
    	component_subscribe($$self, largestZIndex, $$value => $$invalidate(14, $largestZIndex = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Window', slots, ['default']);
    	var _a, _b, _c, _d, _e;

    	class WindowInterface {
    		setWindowSize(width, height) {
    			$$invalidate(3, state_width = width);
    			$$invalidate(4, state_height = height);
    		}

    		hide() {
    			$$invalidate(7, state_visible = false);
    		}

    		show() {
    			$$invalidate(7, state_visible = true);
    		}

    		setPosition(x, y) {
    			$$invalidate(5, state_top = y);
    			$$invalidate(6, state_left = x);

    			// clip window position to screen
    			if (state_top < 0) $$invalidate(5, state_top = 0);

    			if (state_left < 0) $$invalidate(6, state_left = 0);
    			if (state_top + state_height > window.innerHeight) $$invalidate(5, state_top = window.innerHeight - state_height);
    			if (state_left + state_width > window.innerWidth) $$invalidate(6, state_left = window.innerWidth - state_width);
    		}

    		setTitle(to) {
    			$$invalidate(8, state_title = to);
    		}

    		focus() {
    			largestZIndex.update(z => z + 1);
    			$$invalidate(2, state_z_index = get_store_value(largestZIndex));
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
    	largestZIndex.update(z => z + 1);
    	let state_z_index = get_store_value(largestZIndex);
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

    	const click_handler_2 = () => {
    		windowInterface.focus();
    	};

    	$$self.$$set = $$props => {
    		if ('config' in $$props) $$invalidate(0, config = $$props.config);
    		if ('$$scope' in $$props) $$invalidate(15, $$scope = $$props.$$scope);
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
    		top,
    		state_focused,
    		buttonClass,
    		$largestZIndex
    	});

    	$$self.$inject_state = $$props => {
    		if ('_a' in $$props) _a = $$props._a;
    		if ('_b' in $$props) _b = $$props._b;
    		if ('_c' in $$props) _c = $$props._c;
    		if ('_d' in $$props) _d = $$props._d;
    		if ('_e' in $$props) _e = $$props._e;
    		if ('config' in $$props) $$invalidate(0, config = $$props.config);
    		if ('state_width' in $$props) $$invalidate(3, state_width = $$props.state_width);
    		if ('state_height' in $$props) $$invalidate(4, state_height = $$props.state_height);
    		if ('state_top' in $$props) $$invalidate(5, state_top = $$props.state_top);
    		if ('state_left' in $$props) $$invalidate(6, state_left = $$props.state_left);
    		if ('state_visible' in $$props) $$invalidate(7, state_visible = $$props.state_visible);
    		if ('state_title' in $$props) $$invalidate(8, state_title = $$props.state_title);
    		if ('state_z_index' in $$props) $$invalidate(2, state_z_index = $$props.state_z_index);
    		if ('state_maximized' in $$props) $$invalidate(9, state_maximized = $$props.state_maximized);
    		if ('drag' in $$props) $$invalidate(10, drag = $$props.drag);
    		if ('left' in $$props) left = $$props.left;
    		if ('top' in $$props) top = $$props.top;
    		if ('state_focused' in $$props) $$invalidate(13, state_focused = $$props.state_focused);
    		if ('buttonClass' in $$props) $$invalidate(11, buttonClass = $$props.buttonClass);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$largestZIndex, state_z_index*/ 16388) {
    			$$invalidate(13, state_focused = $largestZIndex === state_z_index);
    		}

    		if ($$self.$$.dirty & /*state_focused*/ 8192) {
    			$$invalidate(11, buttonClass = state_focused ? "button" : "button unfocused");
    		}
    	};

    	return [
    		config,
    		windowInterface,
    		state_z_index,
    		state_width,
    		state_height,
    		state_top,
    		state_left,
    		state_visible,
    		state_title,
    		state_maximized,
    		drag,
    		buttonClass,
    		WindowInterface,
    		state_focused,
    		$largestZIndex,
    		$$scope,
    		slots,
    		click_handler,
    		click_handler_1,
    		mousedown_handler,
    		click_handler_2
    	];
    }

    class Window extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			WindowInterface: 12,
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
    		return this.$$.ctx[12];
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

    // (31:4) <Window config={{ ...projectsDims, title: "File Explorer" }}>
    function create_default_slot_4(ctx) {
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
    		id: create_default_slot_4.name,
    		type: "slot",
    		source: "(31:4) <Window config={{ ...projectsDims, title: \\\"File Explorer\\\" }}>",
    		ctx
    	});

    	return block;
    }

    // (35:8) <DefaultStyledWindowContainer>
    function create_default_slot_3(ctx) {
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
    			add_location(span, file, 35, 12, 1658);
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
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(35:8) <DefaultStyledWindowContainer>",
    		ctx
    	});

    	return block;
    }

    // (34:4) <Window config={{ ...contactDims, title: "Contact Info" }}>
    function create_default_slot_2(ctx) {
    	let defaultstyledwindowcontainer;
    	let current;

    	defaultstyledwindowcontainer = new DefaultStyledWindowContainer({
    			props: {
    				$$slots: { default: [create_default_slot_3] },
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
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(34:4) <Window config={{ ...contactDims, title: \\\"Contact Info\\\" }}>",
    		ctx
    	});

    	return block;
    }

    // (58:8) <DefaultStyledWindowContainer>
    function create_default_slot_1(ctx) {
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
    	let t6;
    	let p2;
    	let t7;
    	let a;
    	let t9;

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
    			t6 = space();
    			p2 = element("p");
    			t7 = text("The source code for this website can also be found\n                            ");
    			a = element("a");
    			a.textContent = "here";
    			t9 = text(".");
    			attr_dev(img, "class", "pfp svelte-i40mnl");
    			if (!src_url_equal(img.src, img_src_value = "/images/pfp.jpeg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Profile");
    			add_location(img, file, 60, 20, 2641);
    			add_location(div0, file, 59, 16, 2615);
    			attr_dev(span, "class", "title");
    			set_style(span, "font-size", "24pt");
    			add_location(span, file, 63, 20, 2809);
    			add_location(p0, file, 65, 24, 2921);
    			add_location(p1, file, 70, 24, 3219);
    			attr_dev(a, "href", "https://github.com/iahuang/homepage");
    			add_location(a, file, 77, 28, 3648);
    			add_location(p2, file, 75, 24, 3537);
    			add_location(div1, file, 64, 20, 2891);
    			set_style(div2, "margin-left", "30px");
    			set_style(div2, "margin-right", "10px");
    			add_location(div2, file, 62, 16, 2737);
    			attr_dev(div3, "class", "biography-container svelte-i40mnl");
    			add_location(div3, file, 58, 12, 2565);
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
    			append_dev(div1, t6);
    			append_dev(div1, p2);
    			append_dev(p2, t7);
    			append_dev(p2, a);
    			append_dev(p2, t9);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(58:8) <DefaultStyledWindowContainer>",
    		ctx
    	});

    	return block;
    }

    // (57:4) <Window config={{ ...aboutMeDims, title: "About Me" }}>
    function create_default_slot(ctx) {
    	let defaultstyledwindowcontainer;
    	let current;

    	defaultstyledwindowcontainer = new DefaultStyledWindowContainer({
    			props: {
    				$$slots: { default: [create_default_slot_1] },
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
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(57:4) <Window config={{ ...aboutMeDims, title: \\\"About Me\\\" }}>",
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
    					.../*projectsDims*/ ctx[1],
    					title: "File Explorer"
    				},
    				$$slots: { default: [create_default_slot_4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	window1 = new Window({
    			props: {
    				config: {
    					.../*contactDims*/ ctx[2],
    					title: "Contact Info"
    				},
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	window2 = new Window({
    			props: {
    				config: {
    					.../*aboutMeDims*/ ctx[0],
    					title: "About Me"
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
    			attr_dev(main, "class", "svelte-i40mnl");
    			add_location(main, file, 27, 0, 1411);
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

    			if (dirty & /*projectsDims*/ 2) window0_changes.config = {
    				.../*projectsDims*/ ctx[1],
    				title: "File Explorer"
    			};

    			if (dirty & /*$$scope*/ 16) {
    				window0_changes.$$scope = { dirty, ctx };
    			}

    			window0.$set(window0_changes);
    			const window1_changes = {};

    			if (dirty & /*contactDims*/ 4) window1_changes.config = {
    				.../*contactDims*/ ctx[2],
    				title: "Contact Info"
    			};

    			if (dirty & /*$$scope*/ 16) {
    				window1_changes.$$scope = { dirty, ctx };
    			}

    			window1.$set(window1_changes);
    			const window2_changes = {};

    			if (dirty & /*aboutMeDims*/ 1) window2_changes.config = {
    				.../*aboutMeDims*/ ctx[0],
    				title: "About Me"
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
    		aboutMeDims = Object.assign(Object.assign({}, makeScaledWindowDimensions(0.9)), { top: 20, left: 15 });
    		projectsDims = Object.assign(Object.assign({}, makeScaledWindowDimensions(0.9, 0.6)), { left: 17, bottom: 10 });
    		contactDims = Object.assign(Object.assign({}, makeScaledWindowDimensions(0.9)), { left: 19, bottom: 20 });
    	} else {
    		aboutMeDims = Object.assign(Object.assign({}, makeScaledWindowDimensions(0.45)), { top: 20, left: 15 });
    		projectsDims = Object.assign(Object.assign({}, makeScaledWindowDimensions(0.8, 0.5)), { top: 10, right: 10 });

    		contactDims = Object.assign(Object.assign({}, makeScaledWindowDimensions(0.44, 0.5)), {
    			left: window.innerWidth * 0.3,
    			bottom: 20
    		});
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
    		if ('contactDims' in $$props) $$invalidate(2, contactDims = $$props.contactDims);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [aboutMeDims, projectsDims, contactDims];
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
