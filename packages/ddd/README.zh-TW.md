[English](./README.md) | 繁體中文

# 介紹

@cdziv/devkit-ddd 協助您在程式實作面實現領域驅動設計(DDD)，建構領域知識清晰、易讀、易維護、可擴展的應用。它不依賴任何框架、ORM，可以按需使用於您的應用中。

> **提示**： 此文件假設您對 DDD 有基本概念，若尚未暸解 DDD 以及不知道是否該引入至您的應用中，[Eric Evans 的《領域驅動設計》](https://www.domainlanguage.com/ddd/)是很好的開始。

## 快速起步

### 安裝

```bash
npm install @cdziv/devkit-ddd
```

### 建構一個卡牌遊戲範例

#### 建立值物件

首先，玩家需要一個使用者名稱、籌碼堆餘額。我們將使用者名稱設計為一個值物件：

```ts
// 建立一個值為 DomainPrimitive 的值物件
type UsernameValue = string;
class Username extends ValueObject<UsernameValue> {
  // 必須實作驗證方法
  validate(value: UsernameValue): ValidationResult {
    if (value.length < 3) {
      return false;
    }
    return true;
  }
}

expect(new Username('john_mayer').value).toBe('john_mayer');
```

或是一個帶有鍵值對的物件：

```ts
// 建立一個值為物件的值物件
type DisplayNameValue = {
  firstName: string;
  lastName: string;
};
class DisplayName extends ValueObject<DisplayNameValue> {
  get fullName() {
    return `${this.value.firstName} ${this.value.lastName}`;
  }

  validate(value: DisplayNameValue): ValidationResult {
    if (value.firstName.length < 3 || value.lastName.length < 3) {
      return false;
    }
    return true;
  }
}

const displayName = new DisplayName({
  firstName: 'John',
  lastName: 'Mayer',
});
expect(displayName.value).toEqual({
  firstName: 'John',
  lastName: 'Mayer',
});
expect(displayName.fullName).toBe('John Mayer');
```

請注意，我們將所有領域物件設計為不可變的，所以 withMutations 會返回一個全新的值物件而不是自身。這讓領域物件的實體永遠符合領域不變量，實例化的過程會呼叫 validate 方法，只要您能成功建立該物件——不論是創建、持久還原、還是透過 withMutations——您必須維護其領域不變性，否則，就應該拋出錯誤。

您可以使用 equals 方法來比對兩個值物件的值是否相等：

```ts
const chipCount = new ChipCount(100);
const updatedChipCount = chipCount.add(0);
expect(updatedChipCount).not.toBe(chipCount);
expect(updatedChipCount.equals(chipCount)).toBe(true);
```

現在，是時候來設計玩家物件了。玩家具有唯一識別符，應該被設計為一個實體而非值物件。在撲克遊戲中，玩家不僅應該維護內部狀態的領域不變量，需要加注、喊牌、等待外部事件進行行動而改變內部狀態，就像一個窗口般，因此我們將它設計為聚合根。

聚合根需要定義一個 ID：

```ts
class UUID extends EntityId<string> {
  // 必須實作 rawId getter
  get rawId(): string {
    return this.value;
  }

  // ... 實作內容 ...
}

type PlayerProps = {
  id: UUID;
  username: Username;
  stack: Stack;
  folded: boolean;
};
class Player extends AggregateRoot<PlayerProps, UUID> {
  // 必須實作 id getter
  get id(): UUID {
    return this.props.id;
  }

  validate(props: PlayerProps): ValidationResult {
    // ... 實作內容 ...
  }
}
```

遊戲中，玩家的行為必須被其他玩家接收到，以利進行接下來的行動，所以我們需要定義領域事件：

```ts
class PlayerFolded extends DomainEvent {}
class PlayerChecked extends DomainEvent {}

type PlayerRaisedPayload = {
  amount: number;
};
class PlayerRaised extends DomainEvent<PlayerRaisedPayload> {
  constructor(aggregateId: string, amount: number) {
    super({
      aggregateId,
      amount,
    });
  }
}
```

接著，在玩家行為中加入它們：

```ts
class Player extends AggregateRoot<PlayerProps, UUID> {
  // ... 實作內容 ...

  fold() {
    const event = new PlayerFolded(this.id.rawId);
    return this.withMutations('folded', true).addEvent(event);
  }

  check() {
    const event = new PlayerChecked(this.id.rawId);
    return this.addEvent(event);
  }

  raise(count: ChipCount) {
    const event = new PlayerRaised(this.id.rawId);
    return this.withMutations('stack', stack.raise(count)).addEvent(event);
  }

  // ... 實作內容 ...
}
```

當領域事件伴隨聚合根行為被創建，在「確實發生」時——例如成功持久化——聚合根便可以發布收集在自身的領域事件，進入事件系統：

```ts
const playerProps = {
  // ... 實作屬性 ...
};
let player = new Player(playerProps);

player = player.fold();

player.events; // [PlayerFolded]

// 持久化狀態
await playerRepository.save(player);
// 發布領域事件
player.publishEvents(eventEmitter);
```

## API 參考

TODO
