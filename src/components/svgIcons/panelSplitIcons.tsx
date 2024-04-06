export function SplitTop({ color, className }: { color: string, className: string }) {
    return (
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <rect x="1.00002" y="13" width="12" height="30" rx="2" transform="rotate(-90 1.00002 13)" fill={color} stroke={color} strokeWidth="2" strokeLinejoin="round" />
            <path d="M17.2648 16.3348C16.8418 15.8884 16.1548 15.8884 15.7318 16.3348L10.3173 22.0494C9.89426 22.4959 9.89426 23.2209 10.3173 23.6674C10.7403 24.1138 11.4273 24.1138 11.8503 23.6674L15.4171 19.8993L15.4171 30.8571C15.4171 31.4893 15.901 32 16.5 32C17.099 32 17.5829 31.4893 17.5829 30.8571L17.5829 19.9029L21.1498 23.6638C21.5728 24.1103 22.2597 24.1103 22.6828 23.6638C23.1058 23.2174 23.1058 22.4923 22.6828 22.0459L17.2682 16.3313L17.2648 16.3348Z" fill={color} />
        </svg>

    )
}

export function SplitBottom({ color, className }: { color: string, className: string }) {
    return (
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <rect x="31" y="19" width="12" height="30" rx="2" transform="rotate(90 31 19)" fill={color} stroke={color} strokeWidth="2" strokeLinejoin="round" />
            <path d="M14.7352 15.6652C15.1582 16.1116 15.8452 16.1116 16.2682 15.6652L21.6828 9.95056C22.1058 9.5041 22.1058 8.77906 21.6828 8.33261C21.2597 7.88615 20.5728 7.88615 20.1498 8.33261L16.5829 12.1007L16.5829 1.14292C16.5829 0.510741 16.099 -2.0367e-06 15.5 -2.08192e-06C14.901 -2.12714e-06 14.4171 0.510741 14.4171 1.14292L14.4171 12.0971L10.8503 8.33618C10.4273 7.88972 9.74029 7.88972 9.31727 8.33618C8.89426 8.78263 8.89426 9.50767 9.31727 9.95413L14.7318 15.6687L14.7352 15.6652Z" fill={color} />
        </svg>

    )
}


export function SplitLeft({ color, className }: { color: string, className: string }) {
    return (
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <rect x="13" y="31" width="12" height="30" rx="2" transform="rotate(180 13 31)" fill={color} stroke={color} strokeWidth="2" strokeLinejoin="round" />
            <path d="M16.3349 14.7352C15.8884 15.1582 15.8884 15.8452 16.3349 16.2682L22.0495 21.6827C22.4959 22.1058 23.221 22.1058 23.6674 21.6827C24.1139 21.2597 24.1139 20.5728 23.6674 20.1497L19.8993 16.5829H30.8571C31.4893 16.5829 32 16.099 32 15.5C32 14.901 31.4893 14.4171 30.8571 14.4171H19.9029L23.6638 10.8503C24.1103 10.4272 24.1103 9.74027 23.6638 9.31726C23.2174 8.89425 22.4923 8.89425 22.0459 9.31726L16.3313 14.7318L16.3349 14.7352Z" fill={color} />
        </svg>

    )
}


export function SplitRight({ color, className }: { color: string, className: string }) {
    return (
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <rect x="19" y="1" width="12" height="30" rx="2" fill={color} stroke={color} strokeWidth="2" strokeLinejoin="round" />
            <path d="M15.6652 17.2648C16.1116 16.8418 16.1116 16.1548 15.6652 15.7318L9.95056 10.3173C9.5041 9.89425 8.77906 9.89425 8.33261 10.3173C7.88615 10.7403 7.88615 11.4272 8.33261 11.8503L12.1007 15.4171L1.14292 15.4171C0.510741 15.4171 -1.95204e-06 15.901 -2.00441e-06 16.5C-2.05677e-06 17.099 0.510741 17.5829 1.14292 17.5829L12.0971 17.5829L8.33618 21.1497C7.88972 21.5728 7.88972 22.2597 8.33618 22.6827C8.78263 23.1058 9.50767 23.1058 9.95413 22.6827L15.6687 17.2682L15.6652 17.2648Z" fill={color} />
        </svg>
    )
}
