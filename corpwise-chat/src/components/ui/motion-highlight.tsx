'use client'

import * as React from 'react'
import type { Transition } from 'motion/react'
import { AnimatePresence, motion } from 'motion/react'
import { cn } from '../../lib/utils'

type MotionHighlightMode = 'children' | 'parent'

type Bounds = {
    top: number
    left: number
    width: number
    height: number
}

type MotionHighlightContextType<T extends string> = {
    mode: MotionHighlightMode
    activeValue: T | null
    setActiveValue: (value: T | null) => void
    setBounds: (bounds: DOMRect) => void
    clearBounds: () => void
    id: string
    hover: boolean
    className?: string
    activeClassName?: string
    setActiveClassName: (className: string) => void
    transition?: Transition
    disabled?: boolean
    enabled?: boolean
    exitDelay?: number
    forceUpdateBounds?: boolean
}

const MotionHighlightContext = React.createContext<
    MotionHighlightContextType<any> | undefined
>(undefined)

function useMotionHighlight<T extends string>(): MotionHighlightContextType<T> {
    const context = React.useContext(MotionHighlightContext)
    if (!context) {
        throw new Error('useMotionHighlight must be used within a MotionHighlightProvider')
    }
    return context as unknown as MotionHighlightContextType<T>
}

type ParentModeMotionHighlightProps = {
    boundsOffset?: Partial<Bounds>
    containerClassName?: string
    forceUpdateBounds?: boolean
}

type MotionHighlightProps<T extends string> = React.ComponentProps<'div'> & {
    mode?: MotionHighlightMode
    value?: T | null
    defaultValue?: T | null
    onValueChange?: (value: T | null) => void
    className?: string
    transition?: Transition
    hover?: boolean
    disabled?: boolean
    enabled?: boolean
    exitDelay?: number
    controlledItems?: boolean
    itemsClassName?: string
    boundsOffset?: Partial<Bounds>
    containerClassName?: string
    forceUpdateBounds?: boolean
    children: React.ReactNode
}

function MotionHighlight<T extends string>({ ref, ...props }: MotionHighlightProps<T> & { ref?: React.Ref<HTMLDivElement> }) {
    const {
        children,
        value,
        defaultValue,
        onValueChange,
        className,
        transition = { type: 'spring', stiffness: 350, damping: 35 },
        hover = false,
        enabled = true,
        controlledItems,
        disabled = false,
        exitDelay = 0.2,
        mode = 'children',
    } = props

    const localRef = React.useRef<HTMLDivElement>(null)
    React.useImperativeHandle(ref, () => localRef.current as HTMLDivElement)

    const [activeValue, setActiveValue] = React.useState<T | null>(value ?? defaultValue ?? null)
    const [boundsState, setBoundsState] = React.useState<Bounds | null>(null)
    const [activeClassNameState, setActiveClassNameState] = React.useState<string>('')

    const safeSetActiveValue = React.useCallback(
        (id: T | null) => {
            setActiveValue(prev => (prev === id ? prev : id))
            if (id !== activeValue) onValueChange?.(id as T)
        },
        [activeValue, onValueChange]
    )

    const safeSetBounds = React.useCallback(
        (bounds: DOMRect) => {
            if (!localRef.current) return
            const boundsOffset = (props as ParentModeMotionHighlightProps)?.boundsOffset ?? { top: 0, left: 0, width: 0, height: 0 }
            const containerRect = localRef.current.getBoundingClientRect()
            const newBounds: Bounds = {
                top: bounds.top - containerRect.top + (boundsOffset.top ?? 0),
                left: bounds.left - containerRect.left + (boundsOffset.left ?? 0),
                width: bounds.width + (boundsOffset.width ?? 0),
                height: bounds.height + (boundsOffset.height ?? 0),
            }
            setBoundsState(prev => {
                if (prev && prev.top === newBounds.top && prev.left === newBounds.left && prev.width === newBounds.width && prev.height === newBounds.height) return prev
                return newBounds
            })
        },
        [props]
    )

    const clearBounds = React.useCallback(() => {
        setBoundsState(prev => (prev === null ? prev : null))
    }, [])

    React.useEffect(() => {
        if (value !== undefined) setActiveValue(value)
        else if (defaultValue !== undefined) setActiveValue(defaultValue)
    }, [value, defaultValue])

    const id = React.useId()

    const render = React.useCallback(
        (children: React.ReactNode) => {
            if (mode === 'parent') {
                return (
                    <div
                        ref={localRef}
                        data-slot="motion-highlight-container"
                        className={cn('relative', (props as ParentModeMotionHighlightProps)?.containerClassName)}
                        style={{ position: 'relative' }}
                    >
                        <AnimatePresence initial={false}>
                            {boundsState && (
                                <motion.div
                                    data-slot="motion-highlight"
                                    animate={{ top: boundsState.top, left: boundsState.left, width: boundsState.width, height: boundsState.height, opacity: 1 }}
                                    initial={{ top: boundsState.top, left: boundsState.left, width: boundsState.width, height: boundsState.height, opacity: 0 }}
                                    exit={{ opacity: 0, transition: { ...transition, delay: (transition?.delay ?? 0) + (exitDelay ?? 0) } }}
                                    transition={transition}
                                    className={cn(className, activeClassNameState)}
                                    style={{ position: 'absolute', zIndex: 0, background: 'rgba(255,255,255,0.08)', borderRadius: 9 }}
                                />
                            )}
                        </AnimatePresence>
                        {children}
                    </div>
                )
            }
            return children
        },
        [mode, props, boundsState, transition, exitDelay, className, activeClassNameState]
    )

    return (
        <MotionHighlightContext.Provider
            value={{
                mode,
                activeValue,
                setActiveValue: safeSetActiveValue,
                id,
                hover,
                className,
                transition,
                disabled,
                enabled,
                exitDelay,
                setBounds: safeSetBounds,
                clearBounds,
                activeClassName: activeClassNameState,
                setActiveClassName: setActiveClassNameState,
                forceUpdateBounds: (props as ParentModeMotionHighlightProps)?.forceUpdateBounds,
            }}
        >
            {enabled
                ? controlledItems
                    ? render(children)
                    : render(
                        React.Children.map(children, (child, index) => (
                            <MotionHighlightItem key={index} className={props?.itemsClassName}>
                                {child as React.ReactElement}
                            </MotionHighlightItem>
                        ))
                    )
                : children}
        </MotionHighlightContext.Provider>
    )
}

type MotionHighlightItemProps = React.ComponentProps<'div'> & {
    children: React.ReactElement
    id?: string
    value?: string
    className?: string
    transition?: Transition
    activeClassName?: string
    disabled?: boolean
    exitDelay?: number
    asChild?: boolean
    forceUpdateBounds?: boolean
}

function MotionHighlightItem({
    ref,
    children,
    id,
    value,
    className,
    transition,
    disabled = false,
    activeClassName,
    exitDelay,
    asChild = false,
    forceUpdateBounds,
    ...props
}: MotionHighlightItemProps & { ref?: React.Ref<HTMLDivElement> }) {
    const itemId = React.useId()
    const {
        activeValue,
        setActiveValue,
        mode,
        setBounds,
        clearBounds,
        hover,
        enabled,
        className: contextClassName,
        transition: contextTransition,
        id: contextId,
        disabled: contextDisabled,
        exitDelay: contextExitDelay,
        forceUpdateBounds: contextForceUpdateBounds,
        setActiveClassName,
    } = useMotionHighlight()

    const element = children as React.ReactElement<any>
    const childValue = id ?? value ?? element.props?.['data-value'] ?? element.props?.id ?? itemId
    const isActive = activeValue === childValue
    const isDisabled = disabled === undefined ? contextDisabled : disabled
    const itemTransition = transition ?? contextTransition

    const localRef = React.useRef<HTMLDivElement>(null)
    React.useImperativeHandle(ref, () => localRef.current as HTMLDivElement)

    React.useEffect(() => {
        if (mode !== 'parent') return
        let rafId: number

        const updateBounds = () => {
            if (!localRef.current) return
            const bounds = localRef.current.getBoundingClientRect()
            setBounds(bounds)
        }

        if (isActive) {
            updateBounds()
            setActiveClassName(activeClassName ?? '')
        } else if (!activeValue) clearBounds()

        return () => cancelAnimationFrame(rafId)
    }, [mode, isActive, activeValue, setBounds, clearBounds, activeClassName, setActiveClassName, contextForceUpdateBounds])

    if (!React.isValidElement(children)) return children

    const dataAttributes: Record<string, any> = {
        'data-active': isActive ? 'true' : 'false',
        'aria-selected': isActive,
        'data-disabled': isDisabled,
        'data-value': childValue,
        'data-highlight': true,
    }

    const commonHandlers = hover
        ? {
            onMouseEnter: (e: React.MouseEvent<HTMLDivElement>) => {
                setActiveValue(childValue)
                element.props.onMouseEnter?.(e)
            },
            onMouseLeave: (e: React.MouseEvent<HTMLDivElement>) => {
                setActiveValue(null)
                element.props.onMouseLeave?.(e)
            },
        }
        : {
            onClick: (e: React.MouseEvent<HTMLDivElement>) => {
                setActiveValue(childValue)
                element.props.onClick?.(e)
            },
        }

    return enabled ? (
        <div
            key={childValue}
            ref={localRef}
            data-slot="motion-highlight-item-container"
            className={cn(mode === 'children' && 'relative', className)}
            style={{ position: mode === 'children' ? 'relative' : undefined }}
            {...dataAttributes}
            {...props}
            {...commonHandlers}
        >
            {mode === 'children' && (
                <AnimatePresence initial={false}>
                    {isActive && !isDisabled && (
                        <motion.div
                            layoutId={`transition-background-${contextId}`}
                            data-slot="motion-highlight"
                            className={cn(contextClassName, activeClassName)}
                            style={{
                                position: 'absolute',
                                inset: 0,
                                zIndex: 0,
                                background: 'rgba(255,255,255,0.09)',
                                borderRadius: 8,
                            }}
                            transition={itemTransition}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{
                                opacity: 0,
                                transition: { ...itemTransition, delay: (itemTransition?.delay ?? 0) + (exitDelay ?? contextExitDelay ?? 0) },
                            }}
                            {...dataAttributes}
                        />
                    )}
                </AnimatePresence>
            )}
            {React.cloneElement(element, {
                className: cn('relative', element.props.className),
                style: { position: 'relative', zIndex: 1, ...element.props.style },
                ...Object.keys(dataAttributes).reduce<Record<string, any>>((acc, key) => {
                    if ((element.props as any)[key] === undefined) acc[key] = dataAttributes[key]
                    return acc
                }, {}),
            })}
        </div>
    ) : (
        children
    )
}

export { MotionHighlight, MotionHighlightItem, useMotionHighlight }
export type { MotionHighlightProps, MotionHighlightItemProps }
